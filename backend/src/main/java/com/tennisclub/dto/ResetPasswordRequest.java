package com.tennisclub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for password reset requests.
 * Used when a user resets their password via a token received by email.
 * The confirmPassword field should match newPassword (validated at service level).
 */
public record ResetPasswordRequest(

        @NotBlank(message = "Reset token is required")
        String token,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.,;:_\\-]).+$",
                message = "La password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale"
        )
        String newPassword,

        @NotBlank(message = "Password confirmation is required")
        String confirmPassword

) {
}
