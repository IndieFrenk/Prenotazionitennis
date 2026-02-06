package com.tennisclub.service;

import com.tennisclub.model.EmailVerificationToken;
import com.tennisclub.model.User;
import com.tennisclub.repository.EmailVerificationTokenRepository;
import com.tennisclub.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for handling email verification during user registration.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.email.from:noreply@tennisclub.it}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${app.email.verification.expiration-hours:24}")
    private int expirationHours;

    public EmailVerificationService(
            EmailVerificationTokenRepository tokenRepository,
            UserRepository userRepository,
            JavaMailSender mailSender) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    /**
     * Create a verification token for a user and send the verification email.
     */
    @Transactional
    public void createVerificationTokenAndSendEmail(User user) {
        // Delete any existing tokens for this user
        tokenRepository.findByUser(user).ifPresent(tokenRepository::delete);

        // Create new token
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(expirationHours))
                .build();
        tokenRepository.save(verificationToken);

        // Send verification email
        sendVerificationEmail(user, token);
        log.info("Verification email sent to: {}", user.getEmail());
    }

    /**
     * Verify a user's email using the provided token.
     * Returns true if verification was successful, false otherwise.
     */
    @Transactional
    public boolean verifyEmail(String token) {
        Optional<EmailVerificationToken> optToken = tokenRepository.findByToken(token);

        if (optToken.isEmpty()) {
            log.warn("Verification token not found: {}", token);
            return false;
        }

        EmailVerificationToken verificationToken = optToken.get();

        if (verificationToken.isExpired()) {
            log.warn("Verification token expired for user: {}", verificationToken.getUser().getEmail());
            tokenRepository.delete(verificationToken);
            return false;
        }

        // Mark user as verified
        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // Delete the used token
        tokenRepository.delete(verificationToken);

        log.info("Email verified for user: {}", user.getEmail());
        return true;
    }

    /**
     * Resend verification email to a user.
     * Returns true if email was sent, false if user not found or already verified.
     */
    @Transactional
    public boolean resendVerificationEmail(String email) {
        Optional<User> optUser = userRepository.findByEmail(email);

        if (optUser.isEmpty()) {
            log.warn("Resend verification requested for non-existent email: {}", email);
            return false;
        }

        User user = optUser.get();

        if (user.isEmailVerified()) {
            log.info("User already verified, skipping resend: {}", email);
            return false;
        }

        createVerificationTokenAndSendEmail(user);
        return true;
    }

    /**
     * Clean up expired tokens.
     */
    @Transactional
    public int cleanupExpiredTokens() {
        int deleted = tokenRepository.deleteAllExpiredTokens(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired verification tokens", deleted);
        }
        return deleted;
    }

    /**
     * Send the verification email to the user.
     */
    private void sendVerificationEmail(User user, String token) {
        String verificationUrl = baseUrl + "/auth/verifica-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Tennis Club - Conferma la tua email");
        message.setText(buildEmailBody(user.getUsername(), verificationUrl));

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
            // Don't throw - registration should complete even if email fails
        }
    }

    /**
     * Build the email body text.
     */
    private String buildEmailBody(String username, String verificationUrl) {
        return String.format("""
                Ciao %s,

                Grazie per esserti registrato al Tennis Club!

                Per completare la registrazione e attivare il tuo account, clicca sul seguente link:

                %s

                Il link scadra' tra %d ore.

                Se non hai richiesto questa registrazione, ignora questa email.

                Cordiali saluti,
                Il Team del Tennis Club
                """, username, verificationUrl, expirationHours);
    }
}
