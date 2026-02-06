package com.tennisclub.controller;

import com.tennisclub.auth.CustomUserDetails;
import com.tennisclub.dto.DayScheduleResponse;
import com.tennisclub.dto.PagedResponse;
import com.tennisclub.dto.ReservationRequest;
import com.tennisclub.dto.ReservationResponse;
import com.tennisclub.dto.ReservationStatusUpdateRequest;
import com.tennisclub.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for reservation management.
 * Provides endpoints for users to create and cancel their own reservations,
 * public schedule viewing, and admin reservation management.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    // -----------------------------------------------------------------------
    // Authenticated user endpoints
    // -----------------------------------------------------------------------

    /**
     * Creates a new reservation for the currently authenticated user.
     *
     * @param request the reservation data (court, date, start/end time, notes)
     * @return the created reservation with HTTP 201
     */
    @PostMapping("/reservations")
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody ReservationRequest request) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        ReservationResponse response = reservationService.createReservation(
                userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Cancels a reservation owned by the currently authenticated user.
     * Subject to the cancellation deadline policy.
     *
     * @param id the UUID of the reservation to cancel
     * @return the updated reservation
     */
    @DeleteMapping("/reservations/{id}")
    public ResponseEntity<ReservationResponse> cancelReservation(@PathVariable UUID id) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        ReservationResponse response = reservationService.cancelReservation(
                userDetails.getId(), id);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a paginated list of reservations for the currently authenticated user.
     *
     * @param page the page number (zero-based, default 0)
     * @param size the page size (default 10)
     * @return the user's reservations
     */
    @GetMapping("/reservations/me")
    public ResponseEntity<PagedResponse<ReservationResponse>> getMyReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<ReservationResponse> response = reservationService.getMyReservations(
                userDetails.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // Public schedule endpoints
    // -----------------------------------------------------------------------

    /**
     * Retrieves the daily schedule for a court on a specific date.
     * Returns all time slots with availability information.
     *
     * @param courtId the UUID of the court
     * @param date    the date in yyyy-MM-dd format
     * @return the day schedule with time slot availability
     */
    @GetMapping("/public/courts/{courtId}/schedule")
    public ResponseEntity<DayScheduleResponse> getDaySchedule(
            @PathVariable UUID courtId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DayScheduleResponse response = reservationService.getDaySchedule(courtId, date);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves the weekly schedule for a court starting from a given date.
     * Returns 7 consecutive day schedules.
     *
     * @param courtId   the UUID of the court
     * @param startDate the first date of the week in yyyy-MM-dd format
     * @return the list of day schedules for the week
     */
    @GetMapping("/public/courts/{courtId}/week-schedule")
    public ResponseEntity<List<DayScheduleResponse>> getWeekSchedule(
            @PathVariable UUID courtId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        List<DayScheduleResponse> response = reservationService.getWeekSchedule(courtId, startDate);
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // Admin reservation management
    // -----------------------------------------------------------------------

    /**
     * Retrieves a filtered and paginated list of all reservations.
     * Supports optional filters by court, date, and status.
     * Restricted to administrators.
     *
     * @param courtId optional court UUID filter
     * @param date    optional date filter in yyyy-MM-dd format
     * @param status  optional reservation status filter
     * @param page    the page number (zero-based, default 0)
     * @param size    the page size (default 10)
     * @return a paginated list of reservations
     */
    @GetMapping("/admin/reservations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<ReservationResponse>> getAllReservations(
            @RequestParam(required = false) UUID courtId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<ReservationResponse> response = reservationService.getAllReservations(
                courtId, date, status, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancels a reservation as an administrator. No time restriction is applied.
     * Restricted to administrators.
     *
     * @param id the UUID of the reservation to cancel
     * @return the updated reservation
     */
    @DeleteMapping("/admin/reservations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReservationResponse> adminCancelReservation(@PathVariable UUID id) {
        ReservationResponse response = reservationService.adminCancelReservation(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates the status of a reservation.
     * Restricted to administrators.
     *
     * @param id      the UUID of the reservation
     * @param request the status update request
     * @return the updated reservation
     */
    @PutMapping("/admin/reservations/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReservationResponse> updateReservationStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ReservationStatusUpdateRequest request) {
        ReservationResponse response = reservationService.updateReservationStatus(
                id, request.status());
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Extracts the current authenticated user details from the security context.
     *
     * @return the CustomUserDetails of the authenticated user
     */
    private CustomUserDetails getCurrentUserDetails() {
        return (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
