package com.tennisclub.service;

import com.tennisclub.dto.ResetPasswordRequest;
import com.tennisclub.exception.BadRequestException;
import com.tennisclub.exception.ResourceNotFoundException;
import com.tennisclub.model.User;
import com.tennisclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for the password reset flow.
 * Uses an in-memory {@link ConcurrentHashMap} to store reset tokens with expiration.
 * Tokens are validated on access and expired entries are cleaned up lazily.
 *
 * <p>Note: For a production deployment with multiple instances, consider replacing
 * the in-memory map with a Redis-backed or database-backed token store.</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    /** Token validity period in hours. */
    private static final int TOKEN_EXPIRY_HOURS = 1;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /** In-memory store mapping reset tokens to their metadata. */
    private final Map<String, PasswordResetToken> tokenStore = new ConcurrentHashMap<>();

    /**
     * Inner record representing a password reset token's metadata.
     *
     * @param userId    the UUID of the user who requested the reset
     * @param expiresAt the timestamp after which the token is no longer valid
     */
    record PasswordResetToken(UUID userId, LocalDateTime expiresAt) {}

    /**
     * Initiates a password reset for the user associated with the given email.
     * Generates a unique token, stores it with a 1-hour expiry, and sends
     * a reset email. If no user is found with the given email, the method
     * completes silently to prevent email enumeration attacks.
     *
     * @param email the email address of the user requesting a password reset
     */
    public void requestPasswordReset(String email) {
        // Clean up expired tokens on each request
        cleanupExpiredTokens();

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Do not reveal whether the email exists in the system
            log.warn("Password reset requested for unknown email: {}", email);
            return;
        }

        User user = userOpt.get();

        // Generate a unique token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);

        tokenStore.put(token, new PasswordResetToken(user.getId(), expiresAt));
        log.info("Password reset token generated for user {}", user.getId());

        // Send the reset email
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    /**
     * Resets the user's password using a previously issued token.
     * Validates the token, checks that the new password and confirmation match,
     * encodes the new password, and updates the user entity.
     *
     * @param request the reset password request containing token, new password, and confirmation
     * @throws BadRequestException       if the token is invalid, expired, or passwords do not match
     * @throws ResourceNotFoundException if the user associated with the token no longer exists
     */
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenStore.get(request.token());

        if (resetToken == null) {
            throw new BadRequestException("Il token di recupero password non e' valido");
        }

        if (resetToken.expiresAt().isBefore(LocalDateTime.now())) {
            tokenStore.remove(request.token());
            throw new BadRequestException("Il token di recupero password e' scaduto");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("La nuova password e la conferma non coincidono");
        }

        User user = userRepository.findById(resetToken.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", resetToken.userId()));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Remove the used token
        tokenStore.remove(request.token());
        log.info("Password reset completed for user {}", user.getId());
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Removes all expired tokens from the in-memory store.
     * Called lazily during each reset request to keep memory usage bounded.
     */
    private void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        int before = tokenStore.size();
        tokenStore.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        int removed = before - tokenStore.size();
        if (removed > 0) {
            log.debug("Cleaned up {} expired password reset tokens", removed);
        }
    }
}
