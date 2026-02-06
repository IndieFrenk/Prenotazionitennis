package com.tennisclub.dto;

/**
 * DTO for authentication responses.
 * Returned after a successful login or token refresh, containing JWT tokens and metadata.
 */
public record AuthResponse(

        String accessToken,

        String refreshToken,

        String tokenType,

        long expiresIn

) {

    /**
     * Convenience constructor that defaults the token type to "Bearer".
     *
     * @param accessToken  the JWT access token
     * @param refreshToken the refresh token for obtaining new access tokens
     * @param expiresIn    the access token expiration time in seconds
     */
    public AuthResponse(String accessToken, String refreshToken, long expiresIn) {
        this(accessToken, refreshToken, "Bearer", expiresIn);
    }
}
