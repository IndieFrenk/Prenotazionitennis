package com.tennisclub.controller;

import com.tennisclub.dto.CourtUsageStat;
import com.tennisclub.dto.DashboardStatsResponse;
import com.tennisclub.model.ReservationStatus;
import com.tennisclub.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for the admin dashboard.
 * Provides aggregated statistics about reservations, revenue, and court usage.
 * All endpoints are restricted to administrators.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DashboardController {

    private final ReservationRepository reservationRepository;

    /** Statuses considered as valid (non-cancelled) reservations for counting. */
    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
            ReservationStatus.CONFERMATA,
            ReservationStatus.COMPLETATA
    );

    /**
     * Retrieves dashboard statistics for the specified date range.
     * If no date range is provided, defaults to the first day of the current month
     * through today.
     *
     * <p>Statistics include:
     * <ul>
     *   <li>Total reservations for today</li>
     *   <li>Total reservations for the current week (Monday to Sunday)</li>
     *   <li>Total reservations for the current month</li>
     *   <li>Total revenue in the date range</li>
     *   <li>Per-court usage statistics (reservation count and revenue)</li>
     * </ul>
     *
     * @param fromDate optional start date (inclusive), defaults to first day of current month
     * @param toDate   optional end date (inclusive), defaults to today
     * @return the dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        LocalDate today = LocalDate.now();

        // Default date range: first day of current month to today
        LocalDate from = (fromDate != null) ? fromDate : today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate to = (toDate != null) ? toDate : today;

        // Today's reservations
        long totalToday = reservationRepository.countByReservationDateBetweenAndStatusIn(
                today, today, ACTIVE_STATUSES);

        // This week's reservations (Monday to Sunday)
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        long totalWeek = reservationRepository.countByReservationDateBetweenAndStatusIn(
                weekStart, weekEnd, ACTIVE_STATUSES);

        // This month's reservations
        LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate monthEnd = today.with(TemporalAdjusters.lastDayOfMonth());
        long totalMonth = reservationRepository.countByReservationDateBetweenAndStatusIn(
                monthStart, monthEnd, ACTIVE_STATUSES);

        // Total revenue in the specified date range
        BigDecimal totalRevenue = reservationRepository.getTotalRevenue(from, to, ACTIVE_STATUSES);

        // Per-court usage statistics in the specified date range
        List<Object[]> rawStats = reservationRepository.getCourtUsageStats(from, to, ACTIVE_STATUSES);
        List<CourtUsageStat> courtUsageStats = rawStats.stream()
                .map(row -> new CourtUsageStat(
                        (UUID) row[0],
                        (String) row[1],
                        (Long) row[2],
                        (BigDecimal) row[3]
                ))
                .toList();

        DashboardStatsResponse response = new DashboardStatsResponse(
                totalToday,
                totalWeek,
                totalMonth,
                totalRevenue,
                courtUsageStats
        );

        return ResponseEntity.ok(response);
    }
}
