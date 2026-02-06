package com.tennisclub.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for token refresh requests.
 * Used to obtain a new access token using a valid refresh token.
 */
public record RefreshTokenRequest(

        @NotBlank(message = "Refresh token is required")
        String refreshToken

) {
}
