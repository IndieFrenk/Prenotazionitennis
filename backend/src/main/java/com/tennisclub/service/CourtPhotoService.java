package com.tennisclub.service;

import com.tennisclub.dto.CourtPhotoResponse;
import com.tennisclub.exception.BadRequestException;
import com.tennisclub.exception.ResourceNotFoundException;
import com.tennisclub.model.Court;
import com.tennisclub.model.CourtPhoto;
import com.tennisclub.repository.CourtPhotoRepository;
import com.tennisclub.repository.CourtRepository;
import com.tennisclub.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Service layer for managing court photos.
 * Handles listing, adding, deleting, and reordering photos associated with courts.
 * Delegates file I/O operations to {@link FileStorageService}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CourtPhotoService {

    private static final Logger log = LoggerFactory.getLogger(CourtPhotoService.class);

    private final CourtPhotoRepository courtPhotoRepository;
    private final CourtRepository courtRepository;
    private final FileStorageService fileStorageService;

    /**
     * Retrieves all photos for a given court, ordered by display order.
     *
     * @param courtId the UUID of the court
     * @return list of court photo response DTOs
     */
    @Transactional(readOnly = true)
    public List<CourtPhotoResponse> findByCourtId(UUID courtId) {
        return courtPhotoRepository.findByCourtIdOrderByDisplayOrderAsc(courtId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Adds a new photo to a court. Validates that the court exists and that
     * the maximum photo limit has not been reached, then delegates file storage
     * and persists the photo entity.
     *
     * @param courtId      the UUID of the court
     * @param file         the image file to upload
     * @param displayOrder the display order for the new photo
     * @param altText      optional alt text describing the photo
     * @return the created court photo response DTO
     * @throws ResourceNotFoundException if the court does not exist
     * @throws BadRequestException       if the photo limit has been reached
     */
    public CourtPhotoResponse addPhoto(UUID courtId, MultipartFile file, int displayOrder, String altText) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", courtId));

        long currentCount = courtPhotoRepository.countByCourtId(courtId);
        if (currentCount >= AppConstants.MAX_PHOTOS_PER_COURT) {
            throw new BadRequestException(
                    "Numero massimo di foto raggiunto per questo campo ("
                    + AppConstants.MAX_PHOTOS_PER_COURT + ")");
        }

        // Delegate file storage
        String relativePath = fileStorageService.storeFile(file, "courts");

        CourtPhoto photo = CourtPhoto.builder()
                .court(court)
                .imageUrl(relativePath)
                .displayOrder(displayOrder)
                .altText(altText)
                .build();

        CourtPhoto saved = courtPhotoRepository.save(photo);
        log.info("Photo added to court {}: {}", courtId, relativePath);
        return mapToResponse(saved);
    }

    /**
     * Deletes a photo by its identifier. Removes the file from the filesystem
     * and deletes the entity from the database.
     *
     * @param photoId the UUID of the photo to delete
     * @throws ResourceNotFoundException if no photo with the given id exists
     */
    public void deletePhoto(UUID photoId) {
        CourtPhoto photo = courtPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Foto", "id", photoId));

        // Delete the physical file
        fileStorageService.deleteFile(photo.getImageUrl());

        courtPhotoRepository.delete(photo);
        log.info("Photo deleted: {} (court {})", photoId, photo.getCourt().getId());
    }

    /**
     * Updates the display order of a specific photo.
     *
     * @param photoId  the UUID of the photo
     * @param newOrder the new display order value
     * @throws ResourceNotFoundException if no photo with the given id exists
     */
    public void updatePhotoOrder(UUID photoId, int newOrder) {
        CourtPhoto photo = courtPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Foto", "id", photoId));

        photo.setDisplayOrder(newOrder);
        courtPhotoRepository.save(photo);
        log.info("Photo {} display order updated to {}", photoId, newOrder);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Maps a CourtPhoto entity to a CourtPhotoResponse DTO.
     */
    private CourtPhotoResponse mapToResponse(CourtPhoto photo) {
        return new CourtPhotoResponse(
                photo.getId(),
                photo.getImageUrl(),
                photo.getDisplayOrder(),
                photo.getAltText()
        );
    }
}
