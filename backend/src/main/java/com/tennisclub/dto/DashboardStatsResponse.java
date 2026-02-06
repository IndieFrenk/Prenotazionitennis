package com.tennisclub.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for the admin dashboard statistics response.
 * Provides an overview of reservations, revenue, and per-court usage metrics.
 */
public record DashboardStatsResponse(

        long totalReservationsToday,

        long totalReservationsWeek,

        long totalReservationsMonth,

        BigDecimal totalRevenue,

        List<CourtUsageStat> courtUsageStats

) {
}
