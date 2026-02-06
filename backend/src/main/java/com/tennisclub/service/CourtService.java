package com.tennisclub.service;

import com.tennisclub.dto.CourtPhotoResponse;
import com.tennisclub.dto.CourtRequest;
import com.tennisclub.dto.CourtResponse;
import com.tennisclub.exception.BadRequestException;
import com.tennisclub.exception.DuplicateResourceException;
import com.tennisclub.exception.ResourceNotFoundException;
import com.tennisclub.model.Court;
import com.tennisclub.model.CourtPhoto;
import com.tennisclub.model.CourtStatus;
import com.tennisclub.model.CourtType;
import com.tennisclub.repository.CourtRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

/**
 * Service layer for court management.
 * Handles CRUD operations, filtering by type and status, and display order updates.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CourtService {

    private static final Logger log = LoggerFactory.getLogger(CourtService.class);

    private final CourtRepository courtRepository;

    /**
     * Retrieves all courts ordered by display order ascending.
     *
     * @return list of court response DTOs
     */
    @Transactional(readOnly = true)
    public List<CourtResponse> findAll() {
        return courtRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Retrieves only courts with status ATTIVO, ordered by display order.
     *
     * @return list of active court response DTOs
     */
    @Transactional(readOnly = true)
    public List<CourtResponse> findAllActive() {
        return courtRepository.findByStatusOrderByDisplayOrderAsc(CourtStatus.ATTIVO).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Retrieves active courts filtered by type (TENNIS or PADEL).
     *
     * @param type the court type as a string
     * @return list of matching court response DTOs
     * @throws BadRequestException if the type string is not a valid CourtType
     */
    @Transactional(readOnly = true)
    public List<CourtResponse> findByType(String type) {
        CourtType courtType;
        try {
            courtType = CourtType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Tipo di campo non valido: " + type);
        }

        return courtRepository
                .findByTypeAndStatusOrderByDisplayOrderAsc(courtType, CourtStatus.ATTIVO)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Finds a single court by its unique identifier, including its associated photos.
     *
     * @param courtId the UUID of the court
     * @return the court response DTO with photo details
     * @throws ResourceNotFoundException if no court with the given id exists
     */
    @Transactional(readOnly = true)
    public CourtResponse findById(UUID courtId) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", courtId));
        return mapToResponse(court);
    }

    /**
     * Creates a new court from the given request data.
     * Validates name uniqueness and parses time strings.
     *
     * @param request the court creation request DTO
     * @return the created court response DTO
     * @throws DuplicateResourceException if a court with the same name already exists
     * @throws BadRequestException        if type, status, or time values are invalid
     */
    public CourtResponse create(CourtRequest request) {
        if (courtRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Esiste gia' un campo con il nome: " + request.name());
        }

        CourtType courtType = parseCourtType(request.type());
        CourtStatus courtStatus = parseCourtStatus(request.status());
        LocalTime openingTime = parseTime(request.openingTime(), "orario di apertura");
        LocalTime closingTime = parseTime(request.closingTime(), "orario di chiusura");

        if (!closingTime.isAfter(openingTime)) {
            throw new BadRequestException("L'orario di chiusura deve essere successivo all'orario di apertura");
        }

        Court court = Court.builder()
                .name(request.name())
                .type(courtType)
                .description(request.description())
                .status(courtStatus)
                .basePrice(request.basePrice())
                .memberPrice(request.memberPrice())
                .openingTime(openingTime)
                .closingTime(closingTime)
                .slotDurationMinutes(request.slotDurationMinutes())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .build();

        Court saved = courtRepository.save(court);
        log.info("Court created: {} ({})", saved.getName(), saved.getId());
        return mapToResponse(saved);
    }

    /**
     * Updates an existing court with new data from the request.
     *
     * @param courtId the UUID of the court to update
     * @param request the court update request DTO
     * @return the updated court response DTO
     * @throws ResourceNotFoundException if no court with the given id exists
     * @throws BadRequestException       if type, status, or time values are invalid
     */
    public CourtResponse update(UUID courtId, CourtRequest request) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", courtId));

        CourtType courtType = parseCourtType(request.type());
        CourtStatus courtStatus = parseCourtStatus(request.status());
        LocalTime openingTime = parseTime(request.openingTime(), "orario di apertura");
        LocalTime closingTime = parseTime(request.closingTime(), "orario di chiusura");

        if (!closingTime.isAfter(openingTime)) {
            throw new BadRequestException("L'orario di chiusura deve essere successivo all'orario di apertura");
        }

        court.setName(request.name());
        court.setType(courtType);
        court.setDescription(request.description());
        court.setStatus(courtStatus);
        court.setBasePrice(request.basePrice());
        court.setMemberPrice(request.memberPrice());
        court.setOpeningTime(openingTime);
        court.setClosingTime(closingTime);
        court.setSlotDurationMinutes(request.slotDurationMinutes());
        if (request.displayOrder() != null) {
            court.setDisplayOrder(request.displayOrder());
        }

        Court saved = courtRepository.save(court);
        log.info("Court updated: {} ({})", saved.getName(), saved.getId());
        return mapToResponse(saved);
    }

    /**
     * Deletes a court and its associated photos (cascading).
     *
     * @param courtId the UUID of the court to delete
     * @throws ResourceNotFoundException if no court with the given id exists
     */
    public void delete(UUID courtId) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", courtId));
        courtRepository.delete(court);
        log.info("Court deleted: {} ({})", court.getName(), courtId);
    }

    /**
     * Updates the display order of a specific court.
     *
     * @param courtId the UUID of the court
     * @param order   the new display order value
     * @throws ResourceNotFoundException if no court with the given id exists
     */
    public void updateDisplayOrder(UUID courtId, int order) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", courtId));
        court.setDisplayOrder(order);
        courtRepository.save(court);
        log.info("Display order updated for court {} to {}", courtId, order);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Maps a Court entity to a CourtResponse DTO, including its photos.
     */
    private CourtResponse mapToResponse(Court court) {
        List<CourtPhotoResponse> photoResponses = mapPhotosToResponse(court.getPhotos());
        return new CourtResponse(
                court.getId(),
                court.getName(),
                court.getType().name(),
                court.getDescription(),
                court.getStatus().name(),
                court.getBasePrice(),
                court.getMemberPrice(),
                court.getOpeningTime().toString(),
                court.getClosingTime().toString(),
                court.getSlotDurationMinutes(),
                court.getDisplayOrder(),
                photoResponses
        );
    }

    /**
     * Maps a list of CourtPhoto entities to a list of CourtPhotoResponse DTOs.
     */
    private List<CourtPhotoResponse> mapPhotosToResponse(List<CourtPhoto> photos) {
        if (photos == null) {
            return List.of();
        }
        return photos.stream()
                .map(photo -> new CourtPhotoResponse(
                        photo.getId(),
                        photo.getImageUrl(),
                        photo.getDisplayOrder(),
                        photo.getAltText()
                ))
                .toList();
    }

    /**
     * Parses a court type string into a CourtType enum value.
     */
    private CourtType parseCourtType(String type) {
        if (type == null) {
            throw new BadRequestException("Il tipo di campo e' obbligatorio");
        }
        try {
            return CourtType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Tipo di campo non valido: " + type);
        }
    }

    /**
     * Parses a court status string into a CourtStatus enum value.
     * Defaults to ATTIVO if the string is null or blank.
     */
    private CourtStatus parseCourtStatus(String status) {
        if (status == null || status.isBlank()) {
            return CourtStatus.ATTIVO;
        }
        try {
            return CourtStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Stato del campo non valido: " + status);
        }
    }

    /**
     * Parses a time string (HH:mm format) into a LocalTime.
     *
     * @param time      the time string to parse
     * @param fieldName the field name used in error messages
     * @return the parsed LocalTime
     * @throws BadRequestException if the string cannot be parsed
     */
    private LocalTime parseTime(String time, String fieldName) {
        if (time == null || time.isBlank()) {
            throw new BadRequestException("Il campo " + fieldName + " e' obbligatorio");
        }
        try {
            return LocalTime.parse(time);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Formato non valido per " + fieldName + ": " + time);
        }
    }
}
