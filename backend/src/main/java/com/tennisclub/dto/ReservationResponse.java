package com.tennisclub.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for reservation responses.
 * Contains the full details of a reservation including court and user information.
 */
public record ReservationResponse(

        UUID id,

        UUID userId,

        String username,

        UUID courtId,

        String courtName,

        String courtType,

        String reservationDate,

        String startTime,

        String endTime,

        String status,

        BigDecimal paidPrice,

        String notes,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}
