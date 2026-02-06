package com.tennisclub.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Component responsible for creating, parsing, and validating JWT access tokens.
 * Uses the HMAC-SHA algorithm with a secret key loaded from application properties.
 * <p>
 * Tokens contain the user's email as the subject, along with custom claims for
 * the user ID and role.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    private SecretKey secretKey;

    /**
     * Initializes the HMAC signing key from the Base64-encoded secret.
     * Called automatically after dependency injection is complete.
     */
    @PostConstruct
    public void init() {
        byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT access token for the given user details.
     *
     * @param userDetails the authenticated user's details
     * @return a compact, signed JWT string
     */
    public String generateAccessToken(CustomUserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("userId", userDetails.getId().toString())
                .claim("role", userDetails.getUser().getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Extracts the user's email (subject) from the given token.
     *
     * @param token the JWT string
     * @return the email address stored in the token's subject claim
     */
    public String getUserEmailFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * Extracts the user ID from the given token.
     *
     * @param token the JWT string
     * @return the user ID stored as the "userId" claim
     */
    public String getUserIdFromToken(String token) {
        return getClaimsFromToken(token).get("userId", String.class);
    }

    /**
     * Extracts the user role from the given token.
     *
     * @param token the JWT string
     * @return the role name stored as the "role" claim
     */
    public String getRoleFromToken(String token) {
        return getClaimsFromToken(token).get("role", String.class);
    }

    /**
     * Validates the given JWT token by attempting to parse it. Returns {@code true}
     * if the token is well-formed, properly signed, and not expired.
     * <p>
     * For security reasons, the token value itself is never included in log messages.
     *
     * @param token the JWT string to validate
     * @return {@code true} if valid, {@code false} otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Malformed JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Returns the configured access token expiration duration in milliseconds.
     *
     * @return the access token expiration in milliseconds
     */
    public long getAccessTokenExpiration() {
        return accessTokenExpirationMs;
    }

    /**
     * Parses the JWT token and returns the claims payload.
     *
     * @param token the JWT string
     * @return the parsed claims
     * @throws JwtException if the token is invalid or cannot be parsed
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
