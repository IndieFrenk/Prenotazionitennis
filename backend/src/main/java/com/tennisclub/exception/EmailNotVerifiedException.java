package com.tennisclub.exception;

/**
 * Exception thrown when a user attempts to log in without having verified their email.
 */
public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
