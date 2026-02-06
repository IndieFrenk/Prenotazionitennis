package com.tennisclub.exception;

/**
 * Thrown when a request lacks valid authentication credentials.
 * Results in an HTTP 401 Unauthorized response.
 */
public class UnauthorizedException extends RuntimeException {

    /**
     * Creates a new UnauthorizedException with the given message.
     *
     * @param message the detail message
     */
    public UnauthorizedException(String message) {
        super(message);
    }
}
