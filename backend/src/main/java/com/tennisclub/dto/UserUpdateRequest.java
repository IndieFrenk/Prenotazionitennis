package com.tennisclub.dto;

import jakarta.validation.constraints.Size;

/**
 * DTO for updating user profile information.
 * All fields are optional; only non-null values will be applied.
 */
public record UserUpdateRequest(

        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        String username,

        String role

) {
}
