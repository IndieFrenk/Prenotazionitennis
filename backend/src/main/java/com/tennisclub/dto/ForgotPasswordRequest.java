package com.tennisclub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for forgot-password requests.
 * Triggers a password reset email to the specified address.
 */
public record ForgotPasswordRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        String email

) {
}
