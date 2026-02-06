package com.tennisclub.dto;

/**
 * DTO for updating the club's contact information.
 * All fields are optional; only non-null values will be applied.
 */
public record ContactInfoRequest(

        String address,

        String phone,

        String email,

        String openingHours,

        String welcomeMessage,

        Double latitude,

        Double longitude

) {
}
