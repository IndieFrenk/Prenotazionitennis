package com.tennisclub.auth;

import com.tennisclub.dto.AuthResponse;
import com.tennisclub.dto.LoginRequest;
import com.tennisclub.dto.RefreshTokenRequest;
import com.tennisclub.dto.RegisterRequest;
import com.tennisclub.exception.EmailNotVerifiedException;
import com.tennisclub.model.AccountStatus;
import com.tennisclub.model.RefreshToken;
import com.tennisclub.model.Role;
import com.tennisclub.model.User;
import com.tennisclub.repository.UserRepository;
import com.tennisclub.service.EmailVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service encapsulating the core authentication business logic: registration,
 * login, token refresh, and logout. Coordinates between the user repository,
 * JWT token provider, refresh token service, and Spring Security's
 * authentication manager.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       RefreshTokenService refreshTokenService,
                       AuthenticationManager authenticationManager,
                       EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.authenticationManager = authenticationManager;
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * Registers a new user account with the default role {@link Role#ROLE_USER}.
     * The password is encoded with BCrypt before persistence. A verification email
     * is sent to the user's email address. The user must verify their email before
     * they can log in.
     *
     * @param request the registration request containing username, email, and password
     * @throws IllegalArgumentException if the email address is already registered
     */
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                    "An account with this email address already exists");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.ROLE_USER)
                .accountStatus(AccountStatus.ATTIVO)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("New user registered (pending email verification): {}", user.getEmail());

        // Send verification email
        emailVerificationService.createVerificationTokenAndSendEmail(user);
    }

    /**
     * Authenticates a user with the provided email and password using Spring
     * Security's {@link AuthenticationManager}. On success, generates a new
     * access token and refresh token pair.
     *
     * @param request the login request containing email and password
     * @return an {@link AuthResponse} with the generated tokens
     * @throws BadCredentialsException if the credentials are invalid
     * @throws EmailNotVerifiedException if the user's email is not verified
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // Check if email is verified
        if (!userDetails.getUser().isEmailVerified()) {
            log.warn("Login attempt with unverified email: {}", request.email());
            throw new EmailNotVerifiedException(
                    "Email non verificata. Controlla la tua casella di posta.");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                userDetails.getUser());

        log.info("User logged in: {}", userDetails.getUsername());

        return buildAuthResponse(accessToken, refreshToken.getToken());
    }

    /**
     * Validates the provided refresh token and issues a new access token.
     * The existing refresh token remains valid (rotation is not performed),
     * allowing the client to reuse it until it expires.
     *
     * @param request the refresh token request
     * @return an {@link AuthResponse} with a new access token and the same refresh token
     * @throws IllegalArgumentException if the refresh token is invalid or expired
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(
                request.refreshToken());

        User user = refreshToken.getUser();
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);

        log.debug("Access token refreshed for user: {}", user.getEmail());

        return buildAuthResponse(accessToken, refreshToken.getToken());
    }

    /**
     * Logs out the user by deleting the specified refresh token from the database.
     * The access token will remain valid until it expires (stateless JWT), but the
     * client should discard it.
     *
     * @param refreshToken the refresh token string to revoke
     */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.deleteByToken(refreshToken);
        log.info("User logged out, refresh token revoked");
    }

    /**
     * Builds a standardized authentication response containing the access token,
     * refresh token, token type, and expiration duration.
     *
     * @param accessToken  the JWT access token
     * @param refreshToken the refresh token string
     * @return a populated {@link AuthResponse}
     */
    private AuthResponse buildAuthResponse(String accessToken, String refreshToken) {
        long expiresInSeconds = jwtTokenProvider.getAccessTokenExpiration() / 1000;
        return new AuthResponse(accessToken, refreshToken, expiresInSeconds);
    }
}
