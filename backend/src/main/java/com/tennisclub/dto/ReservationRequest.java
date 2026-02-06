package com.tennisclub.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO for creating a new court reservation.
 * Date and time values are represented as strings in standard formats
 * (yyyy-MM-dd for date, HH:mm for time) and parsed at the service level.
 */
public record ReservationRequest(

        @NotNull(message = "Court ID is required")
        UUID courtId,

        @NotNull(message = "Reservation date is required")
        String reservationDate,

        @NotNull(message = "Start time is required")
        String startTime,

        @NotNull(message = "End time is required")
        String endTime,

        String notes

) {
}
