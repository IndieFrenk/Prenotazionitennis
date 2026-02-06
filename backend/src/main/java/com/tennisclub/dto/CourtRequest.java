package com.tennisclub.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * DTO for creating or updating a court.
 * Contains all configurable properties of a court, including pricing and scheduling.
 */
public record CourtRequest(

        @NotBlank(message = "Court name is required")
        String name,

        @NotNull(message = "Court type is required")
        String type,

        String description,

        @NotNull(message = "Base price is required")
        @Positive(message = "Base price must be positive")
        BigDecimal basePrice,

        @NotNull(message = "Member price is required")
        @Positive(message = "Member price must be positive")
        BigDecimal memberPrice,

        @NotNull(message = "Opening time is required")
        String openingTime,

        @NotNull(message = "Closing time is required")
        String closingTime,

        @Min(value = 30, message = "Slot duration must be at least 30 minutes")
        Integer slotDurationMinutes,

        Integer displayOrder,

        String status

) {

    /**
     * Compact constructor that applies default values.
     * Sets slotDurationMinutes to 60 if not provided.
     */
    public CourtRequest {
        if (slotDurationMinutes == null) {
            slotDurationMinutes = 60;
        }
    }
}
