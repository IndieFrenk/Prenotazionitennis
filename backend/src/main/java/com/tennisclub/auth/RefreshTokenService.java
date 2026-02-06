package com.tennisclub.auth;

import com.tennisclub.model.RefreshToken;
import com.tennisclub.model.User;
import com.tennisclub.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service responsible for creating, validating, and revoking refresh tokens.
 * Refresh tokens are persisted in the database and tied to a specific user.
 * They allow clients to obtain new access tokens without re-authenticating.
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpirationMs;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Creates a new refresh token for the given user and persists it.
     * The token value is a randomly generated UUID string.
     *
     * @param user the user to associate the refresh token with
     * @return the saved {@link RefreshToken} entity
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000))
                .build();

        refreshToken = refreshTokenRepository.save(refreshToken);
        log.debug("Created refresh token for user: {}", user.getEmail());

        return refreshToken;
    }

    /**
     * Validates a refresh token by looking it up in the database and checking
     * that it has not expired. If the token is expired, it is deleted and an
     * {@link IllegalArgumentException} is thrown.
     *
     * @param token the refresh token string to validate
     * @return the valid {@link RefreshToken} entity
     * @throws IllegalArgumentException if the token does not exist or has expired
     */
    @Transactional
    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Refresh token not found"));

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException(
                    "Refresh token has expired. Please log in again.");
        }

        return refreshToken;
    }

    /**
     * Deletes all refresh tokens belonging to the specified user.
     * Typically called during logout to invalidate all active sessions.
     *
     * @param userId the UUID of the user whose tokens should be revoked
     */
    @Transactional
    public void deleteByUserId(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
        log.debug("Deleted all refresh tokens for user ID: {}", userId);
    }

    /**
     * Deletes a single refresh token by its token string value.
     *
     * @param token the refresh token string to delete
     */
    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.deleteByToken(token);
        log.debug("Deleted refresh token");
    }
}
