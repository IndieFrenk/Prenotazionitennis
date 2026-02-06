package com.tennisclub.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO representing usage statistics for a single court.
 * Used as part of the admin dashboard statistics.
 */
public record CourtUsageStat(

        UUID courtId,

        String courtName,

        long reservationCount,

        BigDecimal revenue

) {
}
