package com.tennisclub.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for court responses.
 * Represents the full public view of a court, including its photos.
 */
public record CourtResponse(

        UUID id,

        String name,

        String type,

        String description,

        String status,

        BigDecimal basePrice,

        BigDecimal memberPrice,

        String openingTime,

        String closingTime,

        int slotDurationMinutes,

        int displayOrder,

        List<CourtPhotoResponse> photos

) {
}
