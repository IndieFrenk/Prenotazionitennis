package com.tennisclub.repository;

import com.tennisclub.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link RefreshToken} entity.
 * Handles token lookup, deletion by user or token value, and cleanup
 * of expired tokens.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /**
     * Find a refresh token by its token string value.
     *
     * @param token the token string
     * @return an Optional containing the refresh token if found
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Delete all refresh tokens belonging to a specific user.
     * Typically used during logout to invalidate all sessions.
     *
     * @param userId the UUID of the user whose tokens should be deleted
     */
    @Transactional
    void deleteByUserId(UUID userId);

    /**
     * Delete a single refresh token by its token string value.
     *
     * @param token the token string to delete
     */
    @Transactional
    void deleteByToken(String token);

    /**
     * Delete all refresh tokens whose expiry date is before the given timestamp.
     * Intended to be called periodically (e.g. via a scheduled task) to keep the
     * token table clean.
     *
     * @param now the current date-time; tokens expiring before this are removed
     * @return the number of deleted tokens
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiryDate < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
}
