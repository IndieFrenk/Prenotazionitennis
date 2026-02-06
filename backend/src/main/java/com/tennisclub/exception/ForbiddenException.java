package com.tennisclub.exception;

/**
 * Thrown when an authenticated user does not have permission to perform the requested action.
 * Results in an HTTP 403 Forbidden response.
 */
public class ForbiddenException extends RuntimeException {

    /**
     * Creates a new ForbiddenException with the given message.
     *
     * @param message the detail message
     */
    public ForbiddenException(String message) {
        super(message);
    }
}
