package com.tennisclub.repository;

import com.tennisclub.model.EmailVerificationToken;
import com.tennisclub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for email verification token operations.
 */
@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    /**
     * Find a verification token by its token string.
     */
    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Find a verification token by user.
     */
    Optional<EmailVerificationToken> findByUser(User user);

    /**
     * Delete all tokens for a specific user.
     */
    void deleteByUser(User user);

    /**
     * Delete all expired tokens.
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiryDate < :now")
    int deleteAllExpiredTokens(LocalDateTime now);
}
