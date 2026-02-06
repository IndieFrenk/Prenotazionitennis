package com.tennisclub.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for user login requests.
 * Contains the credentials required for authentication.
 */
public record LoginRequest(

        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        String password

) {
}
