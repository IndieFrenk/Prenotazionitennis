package com.tennisclub.dto;

import java.time.LocalDateTime;

/**
 * DTO for contact information responses.
 * Contains the club's public contact details and geographic coordinates.
 */
public record ContactInfoResponse(

        String address,

        String phone,

        String email,

        String openingHours,

        String welcomeMessage,

        Double latitude,

        Double longitude,

        LocalDateTime updatedAt

) {
}
