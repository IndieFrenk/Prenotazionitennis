package com.tennisclub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for password change requests.
 * Used when an authenticated user wants to update their password.
 * The confirmPassword field should match newPassword (validated at service level).
 */
public record ChangePasswordRequest(

        @NotBlank(message = "Old password is required")
        String oldPassword,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
        String newPassword,

        @NotBlank(message = "Password confirmation is required")
        String confirmPassword

) {
}
