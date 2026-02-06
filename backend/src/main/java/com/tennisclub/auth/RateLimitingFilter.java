package com.tennisclub.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * A servlet filter that applies IP-based rate limiting to sensitive
 * authentication endpoints. Uses a Caffeine cache to track the number
 * of requests per IP address within a sliding one-minute window.
 * <p>
 * Protected endpoints:
 * <ul>
 *   <li>{@code POST /api/auth/login} - login attempts</li>
 *   <li>{@code POST /api/auth/forgot-password} - password reset requests</li>
 * </ul>
 * <p>
 * When an IP exceeds the configured threshold (10 requests per minute),
 * a {@code 429 Too Many Requests} response is returned with a JSON error body.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    private static final int MAX_REQUESTS_PER_MINUTE = 10;

    /**
     * Paths and methods subject to rate limiting.
     */
    private static final List<String> RATE_LIMITED_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/forgot-password"
    );

    /**
     * Cache mapping client IP addresses to their request counters.
     * Entries expire one minute after creation, effectively creating
     * a sliding window for rate limiting.
     */
    private final Cache<String, AtomicInteger> requestCounts = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Checks whether the incoming request targets a rate-limited endpoint and,
     * if so, whether the client IP has exceeded the allowed number of requests.
     *
     * @param request     the incoming HTTP request
     * @param response    the HTTP response
     * @param filterChain the remaining filter chain
     * @throws ServletException if a servlet error occurs
     * @throws IOException      if an I/O error occurs
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (isRateLimitedRequest(request)) {
            String clientIp = getClientIpAddress(request);
            AtomicInteger counter = requestCounts.get(clientIp,
                    key -> new AtomicInteger(0));

            int currentCount = counter.incrementAndGet();

            if (currentCount > MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for IP: {} on path: {}",
                        clientIp, request.getRequestURI());
                sendTooManyRequestsResponse(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Determines whether the request targets one of the rate-limited endpoints
     * and uses the POST method.
     *
     * @param request the HTTP request
     * @return {@code true} if the request should be rate-limited
     */
    private boolean isRateLimitedRequest(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        return RATE_LIMITED_PATHS.stream().anyMatch(path::equals);
    }

    /**
     * Extracts the client's IP address from the request, considering the
     * {@code X-Forwarded-For} header for requests routed through proxies or
     * load balancers.
     *
     * @param request the HTTP request
     * @return the client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");

        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in the chain (the original client)
            return xForwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    /**
     * Writes a JSON error response with HTTP 429 status code.
     *
     * @param response the HTTP response to write to
     * @throws IOException if writing the response fails
     */
    private void sendTooManyRequestsResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorBody = Map.of(
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "message", "Too many requests. Please try again later.",
                "timestamp", LocalDateTime.now().toString(),
                "errors", List.of()
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }
}
