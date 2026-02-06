package com.tennisclub.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Standard error response structure for the API.
 * Returned whenever a request results in an error, providing the HTTP status,
 * a human-readable message, the timestamp, and optional field-level validation errors.
 */
public record ApiError(

        int status,

        String message,

        LocalDateTime timestamp,

        List<String> errors

) {

    /**
     * Convenience constructor for errors without field-level details.
     *
     * @param status  the HTTP status code
     * @param message the error message
     */
    public ApiError(int status, String message) {
        this(status, message, LocalDateTime.now(), List.of());
    }
}
