package com.tennisclub.controller;

import com.tennisclub.auth.AuthService;
import com.tennisclub.dto.AuthResponse;
import com.tennisclub.dto.ForgotPasswordRequest;
import com.tennisclub.dto.LoginRequest;
import com.tennisclub.dto.RefreshTokenRequest;
import com.tennisclub.dto.RegisterRequest;
import com.tennisclub.dto.ResetPasswordRequest;
import com.tennisclub.service.EmailVerificationService;
import com.tennisclub.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller handling authentication-related endpoints.
 * Provides registration, login, token refresh, logout, and password recovery flows.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;

    /**
     * Registers a new user account.
     * A verification email is sent to the provided email address.
     *
     * @param request the registration data (username, email, password)
     * @return a confirmation message with HTTP 201
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("messaggio", "Registrazione completata. Controlla la tua email per verificare l'account."));
    }

    /**
     * Authenticates a user with email and password.
     *
     * @param request the login credentials
     * @return the authentication tokens with HTTP 200
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Refreshes an access token using a valid refresh token.
     *
     * @param request the refresh token request
     * @return a new set of authentication tokens with HTTP 200
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Logs out the user by revoking the provided refresh token.
     *
     * @param body a map containing the "refreshToken" key
     * @return HTTP 204 No Content
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        authService.logout(refreshToken);
        return ResponseEntity.noContent().build();
    }

    /**
     * Initiates the password reset flow by sending a recovery email.
     * Always returns a success message regardless of whether the email exists,
     * to prevent email enumeration.
     *
     * @param request the forgot-password request containing the user's email
     * @return a confirmation message with HTTP 200
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.email());
        return ResponseEntity.ok(
                Map.of("messaggio", "Se l'email e' registrata, riceverai un link per il recupero della password"));
    }

    /**
     * Resets the user's password using a previously issued reset token.
     *
     * @param request the reset-password request containing token and new password
     * @return a confirmation message with HTTP 200
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(
                Map.of("messaggio", "Password reimpostata con successo"));
    }

    /**
     * Verifies a user's email address using the provided token.
     *
     * @param token the verification token from the email link
     * @return a confirmation message with HTTP 200, or error message with HTTP 400
     */
    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        boolean verified = emailVerificationService.verifyEmail(token);
        if (verified) {
            return ResponseEntity.ok(
                    Map.of("messaggio", "Email verificata con successo. Ora puoi effettuare il login."));
        } else {
            return ResponseEntity.badRequest().body(
                    Map.of("messaggio", "Token di verifica non valido o scaduto."));
        }
    }

    /**
     * Resends the verification email to a user.
     *
     * @param body a map containing the "email" key
     * @return a confirmation message with HTTP 200
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        emailVerificationService.resendVerificationEmail(email);
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(
                Map.of("messaggio", "Se l'email e' registrata e non ancora verificata, riceverai un nuovo link di verifica."));
    }
}
