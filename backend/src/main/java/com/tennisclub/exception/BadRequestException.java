package com.tennisclub.exception;

/**
 * Thrown when a client request is malformed or contains invalid data.
 * Results in an HTTP 400 Bad Request response.
 */
public class BadRequestException extends RuntimeException {

    /**
     * Creates a new BadRequestException with the given message.
     *
     * @param message the detail message
     */
    public BadRequestException(String message) {
        super(message);
    }
}
