package com.tennisclub.exception;

/**
 * Thrown when an attempt is made to create a resource that already exists.
 * Results in an HTTP 409 Conflict response.
 */
public class DuplicateResourceException extends RuntimeException {

    /**
     * Creates a new DuplicateResourceException with the given message.
     *
     * @param message the detail message
     */
    public DuplicateResourceException(String message) {
        super(message);
    }
}
