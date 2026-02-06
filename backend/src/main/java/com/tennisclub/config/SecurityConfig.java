package com.tennisclub.config;

import com.tennisclub.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Central Spring Security configuration.
 *
 * - CSRF is disabled because the API is stateless and uses JWT tokens.
 * - Sessions are set to STATELESS; no server-side session is created.
 * - CORS is delegated to the CorsConfig bean so that the security filter chain
 *   picks up the same CORS rules defined in application.properties.
 * - Public endpoints (auth, docs, uploads) are open to all.
 * - Admin and member endpoints are protected by role.
 * - Every other /api/** path requires authentication.
 * - The JWT filter runs before UsernamePasswordAuthenticationFilter.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // -- Public endpoints that do not require authentication --
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/**",
            "/api/public/**",
            "/api/uploads/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF -- stateless JWT-based API
                .csrf(AbstractHttpConfigurer::disable)

                // Use the CORS configuration provided by CorsConfig
                .cors(cors -> cors.configurationSource(request -> {
                    // Delegate to the global CORS configuration registered via WebMvcConfigurer.
                    // Returning null here makes Spring Security fall back to the MVC CORS config.
                    return null;
                }))

                // Stateless session management
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Endpoint authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()

                        // Admin-only endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Member endpoints accessible by MEMBER or ADMIN
                        .requestMatchers("/api/member/**").hasAnyRole("MEMBER", "ADMIN")

                        // All remaining /api/** endpoints require authentication
                        .requestMatchers("/api/**").authenticated()

                        // Non-API requests (e.g. static resources) are allowed
                        .anyRequest().permitAll()
                )

                // Register the JWT filter before the default username/password filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCrypt password encoder bean used for hashing and verifying passwords.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Exposes the default AuthenticationManager so it can be injected into
     * services (e.g. the login endpoint) that need to authenticate credentials.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
