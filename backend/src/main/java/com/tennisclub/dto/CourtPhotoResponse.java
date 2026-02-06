package com.tennisclub.dto;

import java.util.UUID;

/**
 * DTO for court photo responses.
 * Represents a single photo associated with a court.
 */
public record CourtPhotoResponse(

        UUID id,

        String imageUrl,

        int displayOrder,

        String altText

) {
}
