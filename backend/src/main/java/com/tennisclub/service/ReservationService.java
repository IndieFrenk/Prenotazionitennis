package com.tennisclub.service;

import com.tennisclub.dto.DayScheduleResponse;
import com.tennisclub.dto.PagedResponse;
import com.tennisclub.dto.ReservationRequest;
import com.tennisclub.dto.ReservationResponse;
import com.tennisclub.dto.TimeSlotResponse;
import com.tennisclub.exception.BadRequestException;
import com.tennisclub.exception.ForbiddenException;
import com.tennisclub.exception.ResourceNotFoundException;
import com.tennisclub.model.Court;
import com.tennisclub.model.CourtStatus;
import com.tennisclub.model.Reservation;
import com.tennisclub.model.ReservationStatus;
import com.tennisclub.model.Role;
import com.tennisclub.model.User;
import com.tennisclub.repository.CourtRepository;
import com.tennisclub.repository.ReservationRepository;
import com.tennisclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service layer for reservation management.
 * Implements all booking business rules including time-slot validation,
 * overlap detection, pricing, cancellation policies, and schedule generation.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final ReservationRepository reservationRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;

    @Value("${app.club.max-future-reservations:5}")
    private int maxFutureReservations;

    @Value("${app.club.cancellation-deadline-hours:2}")
    private int cancellationDeadlineHours;

    // -----------------------------------------------------------------------
    // Booking
    // -----------------------------------------------------------------------

    /**
     * Creates a new reservation for the given user.
     * Applies the full set of business validations:
     * <ul>
     *   <li>Court must not be in maintenance</li>
     *   <li>End time must be after start time</li>
     *   <li>Slot must fit within court operating hours</li>
     *   <li>No overlapping confirmed reservations</li>
     *   <li>User must not exceed the maximum number of future reservations</li>
     * </ul>
     * Pricing is determined by the user's role: members get the member price,
     * all other roles get the base price.
     *
     * @param userId  the UUID of the user making the reservation
     * @param request the reservation request DTO
     * @return the created reservation response DTO
     */
    public ReservationResponse createReservation(UUID userId, ReservationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", userId));

        Court court = courtRepository.findById(request.courtId())
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", request.courtId()));

        // Court must be active
        if (court.getStatus() == CourtStatus.MANUTENZIONE) {
            throw new BadRequestException("Il campo e' attualmente in manutenzione");
        }

        // Parse date and times
        LocalDate date = parseDate(request.reservationDate());
        LocalTime startTime = parseTime(request.startTime());
        LocalTime endTime = parseTime(request.endTime());

        // Validate time ordering
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("L'orario di fine deve essere successivo all'orario di inizio");
        }

        // Validate slot fits within court operating hours
        validateTimeSlot(court, date, startTime, endTime);

        // Check for overlapping confirmed reservations
        boolean overlap = reservationRepository.existsOverlappingReservation(
                court.getId(), date, startTime, endTime);
        if (overlap) {
            throw new BadRequestException("Lo slot selezionato e' gia' occupato da un'altra prenotazione");
        }

        // Check max future reservations
        long futureCount = reservationRepository.countFutureConfirmedReservations(
                userId, LocalDate.now(), LocalTime.now());
        if (futureCount >= maxFutureReservations) {
            throw new BadRequestException(
                    "Hai raggiunto il numero massimo di prenotazioni future consentite ("
                    + maxFutureReservations + ")");
        }

        // Calculate price based on user role
        BigDecimal price = (user.getRole() == Role.ROLE_MEMBER)
                ? court.getMemberPrice()
                : court.getBasePrice();

        Reservation reservation = Reservation.builder()
                .user(user)
                .court(court)
                .reservationDate(date)
                .startTime(startTime)
                .endTime(endTime)
                .status(ReservationStatus.CONFERMATA)
                .paidPrice(price)
                .notes(request.notes())
                .build();

        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation created: {} by user {} on court {} for {} {}-{}",
                saved.getId(), userId, court.getName(), date, startTime, endTime);
        return mapToResponse(saved);
    }

    // -----------------------------------------------------------------------
    // Cancellation
    // -----------------------------------------------------------------------

    /**
     * Cancels a reservation on behalf of the owning user.
     * The reservation must be confirmed and the cancellation deadline
     * (configurable hours before the start) must not have passed.
     *
     * @param userId        the UUID of the user requesting cancellation
     * @param reservationId the UUID of the reservation to cancel
     * @return the updated reservation response DTO
     */
    public ReservationResponse cancelReservation(UUID userId, UUID reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prenotazione", "id", reservationId));

        // Verify ownership
        if (!reservation.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Non sei autorizzato a cancellare questa prenotazione");
        }

        // Must be confirmed
        if (reservation.getStatus() != ReservationStatus.CONFERMATA) {
            throw new BadRequestException("Solo le prenotazioni confermate possono essere cancellate");
        }

        // Check cancellation deadline
        LocalDateTime reservationStart = LocalDateTime.of(
                reservation.getReservationDate(), reservation.getStartTime());
        LocalDateTime deadline = reservationStart.minusHours(cancellationDeadlineHours);

        if (LocalDateTime.now().isAfter(deadline)) {
            throw new BadRequestException(
                    "Non e' possibile cancellare la prenotazione a meno di "
                    + cancellationDeadlineHours + " ore dall'inizio");
        }

        reservation.setStatus(ReservationStatus.CANCELLATA);
        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation {} cancelled by user {}", reservationId, userId);
        return mapToResponse(saved);
    }

    /**
     * Cancels a reservation as an administrator. No time restriction is applied.
     *
     * @param reservationId the UUID of the reservation to cancel
     * @return the updated reservation response DTO
     */
    public ReservationResponse adminCancelReservation(UUID reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prenotazione", "id", reservationId));

        reservation.setStatus(ReservationStatus.CANCELLATA);
        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation {} cancelled by admin", reservationId);
        return mapToResponse(saved);
    }

    /**
     * Updates the status of a reservation. Used by administrators to set
     * any valid status (e.g. COMPLETATA, CANCELLATA).
     *
     * @param reservationId the UUID of the reservation
     * @param newStatus     the new status as a string
     * @return the updated reservation response DTO
     * @throws BadRequestException       if the status string is not a valid ReservationStatus
     * @throws ResourceNotFoundException if the reservation does not exist
     */
    public ReservationResponse updateReservationStatus(UUID reservationId, String newStatus) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prenotazione", "id", reservationId));

        ReservationStatus status;
        try {
            status = ReservationStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Stato prenotazione non valido: " + newStatus);
        }

        reservation.setStatus(status);
        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation {} status updated to {}", reservationId, status);
        return mapToResponse(saved);
    }

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------

    /**
     * Retrieves a paginated list of reservations for a specific user.
     *
     * @param userId   the UUID of the user
     * @param pageable pagination and sorting parameters
     * @return a paged response of reservation DTOs
     */
    @Transactional(readOnly = true)
    public PagedResponse<ReservationResponse> getMyReservations(UUID userId, Pageable pageable) {
        Page<Reservation> page = reservationRepository
                .findByUserIdOrderByReservationDateDescStartTimeDesc(userId, pageable);
        return buildPagedResponse(page);
    }

    /**
     * Generates the daily schedule for a court on a specific date.
     * Creates time slots from the court's opening time to its closing time
     * using the configured slot duration, and marks each slot as available
     * or occupied based on existing confirmed reservations.
     *
     * @param courtId the UUID of the court
     * @param date    the date for which to generate the schedule
     * @return the day schedule response DTO
     */
    @Transactional(readOnly = true)
    public DayScheduleResponse getDaySchedule(UUID courtId, LocalDate date) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Campo", "id", courtId));

        // Get confirmed reservations for this court and date
        List<Reservation> confirmedReservations = reservationRepository
                .findByCourtIdAndReservationDateAndStatus(
                        courtId, date, ReservationStatus.CONFERMATA);

        // Generate time slots
        List<TimeSlotResponse> slots = new ArrayList<>();
        LocalTime current = court.getOpeningTime();
        int slotMinutes = court.getSlotDurationMinutes();

        while (current.plusMinutes(slotMinutes).compareTo(court.getClosingTime()) <= 0) {
            LocalTime slotEnd = current.plusMinutes(slotMinutes);

            // Check if this slot is occupied by any confirmed reservation
            final LocalTime slotStart = current;
            Reservation occupying = confirmedReservations.stream()
                    .filter(r -> r.getStartTime().isBefore(slotEnd) && r.getEndTime().isAfter(slotStart))
                    .findFirst()
                    .orElse(null);

            boolean available = (occupying == null);
            UUID reservationId = (occupying != null) ? occupying.getId() : null;

            slots.add(new TimeSlotResponse(
                    current.format(TIME_FORMAT),
                    slotEnd.format(TIME_FORMAT),
                    available,
                    reservationId
            ));

            current = slotEnd;
        }

        return new DayScheduleResponse(
                date.format(DATE_FORMAT),
                court.getId(),
                court.getName(),
                slots
        );
    }

    /**
     * Generates the weekly schedule for a court starting from the given date.
     * Returns a list of 7 day schedules.
     *
     * @param courtId   the UUID of the court
     * @param startDate the first date of the week
     * @return list of day schedule response DTOs for 7 consecutive days
     */
    @Transactional(readOnly = true)
    public List<DayScheduleResponse> getWeekSchedule(UUID courtId, LocalDate startDate) {
        List<DayScheduleResponse> weekSchedule = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            weekSchedule.add(getDaySchedule(courtId, startDate.plusDays(i)));
        }
        return weekSchedule;
    }

    /**
     * Retrieves a filtered and paginated list of all reservations for admin use.
     * Supports optional filters by court, date, and status.
     *
     * @param courtId  optional court filter
     * @param date     optional date filter
     * @param status   optional status filter as a string
     * @param pageable pagination and sorting parameters
     * @return a paged response of reservation DTOs
     */
    @Transactional(readOnly = true)
    public PagedResponse<ReservationResponse> getAllReservations(
            UUID courtId, LocalDate date, String status, Pageable pageable) {

        Page<Reservation> page;

        // Determine the appropriate query based on provided filters
        if (courtId != null) {
            page = reservationRepository.findByCourtId(courtId, pageable);
        } else if (date != null && status != null && !status.isBlank()) {
            ReservationStatus reservationStatus = parseReservationStatus(status);
            page = reservationRepository.findByReservationDateAndStatus(date, reservationStatus, pageable);
        } else if (date != null) {
            page = reservationRepository.findByReservationDate(date, pageable);
        } else if (status != null && !status.isBlank()) {
            ReservationStatus reservationStatus = parseReservationStatus(status);
            page = reservationRepository.findByStatus(reservationStatus, pageable);
        } else {
            page = reservationRepository.findAll(pageable);
        }

        return buildPagedResponse(page);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Validates that a requested time slot fits within the court's operating hours.
     *
     * @param court     the court entity
     * @param date      the reservation date
     * @param startTime the requested start time
     * @param endTime   the requested end time
     * @throws BadRequestException if the slot does not fit within court hours
     */
    private void validateTimeSlot(Court court, LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (startTime.isBefore(court.getOpeningTime())) {
            throw new BadRequestException(
                    "L'orario di inizio non puo' essere prima dell'apertura del campo ("
                    + court.getOpeningTime().format(TIME_FORMAT) + ")");
        }
        if (endTime.isAfter(court.getClosingTime())) {
            throw new BadRequestException(
                    "L'orario di fine non puo' essere dopo la chiusura del campo ("
                    + court.getClosingTime().format(TIME_FORMAT) + ")");
        }
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Non e' possibile prenotare per una data passata");
        }
    }

    /**
     * Maps a Reservation entity to a ReservationResponse DTO.
     */
    private ReservationResponse mapToResponse(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getUser().getId(),
                reservation.getUser().getUsername(),
                reservation.getCourt().getId(),
                reservation.getCourt().getName(),
                reservation.getCourt().getType().name(),
                reservation.getReservationDate().format(DATE_FORMAT),
                reservation.getStartTime().format(TIME_FORMAT),
                reservation.getEndTime().format(TIME_FORMAT),
                reservation.getStatus().name(),
                reservation.getPaidPrice(),
                reservation.getNotes(),
                reservation.getCreatedAt(),
                reservation.getUpdatedAt()
        );
    }

    /**
     * Builds a PagedResponse from a Spring Data Page of reservations.
     */
    private PagedResponse<ReservationResponse> buildPagedResponse(Page<Reservation> page) {
        var responses = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return new PagedResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    /**
     * Parses a date string in yyyy-MM-dd format into a LocalDate.
     *
     * @param dateStr the date string to parse
     * @return the parsed LocalDate
     * @throws BadRequestException if the string cannot be parsed
     */
    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DATE_FORMAT);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Formato data non valido: " + dateStr + ". Utilizzare yyyy-MM-dd");
        }
    }

    /**
     * Parses a time string in HH:mm format into a LocalTime.
     *
     * @param timeStr the time string to parse
     * @return the parsed LocalTime
     * @throws BadRequestException if the string cannot be parsed
     */
    private LocalTime parseTime(String timeStr) {
        try {
            return LocalTime.parse(timeStr, TIME_FORMAT);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("Formato orario non valido: " + timeStr + ". Utilizzare HH:mm");
        }
    }

    /**
     * Parses a reservation status string into a ReservationStatus enum value.
     *
     * @param status the status string
     * @return the parsed ReservationStatus
     * @throws BadRequestException if the string is not a valid status
     */
    private ReservationStatus parseReservationStatus(String status) {
        try {
            return ReservationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Stato prenotazione non valido: " + status);
        }
    }
}
