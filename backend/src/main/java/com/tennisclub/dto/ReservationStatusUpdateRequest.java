package com.tennisclub.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for updating the status of an existing reservation.
 * Typical status values include: CONFIRMED, CANCELLED, COMPLETED, NO_SHOW.
 */
public record ReservationStatusUpdateRequest(

        @NotBlank(message = "Status is required")
        String status

) {
}
