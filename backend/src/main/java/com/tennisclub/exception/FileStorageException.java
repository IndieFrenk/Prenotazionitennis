package com.tennisclub.exception;

/**
 * Thrown when a file storage operation fails (upload, download, deletion, etc.).
 * Results in an HTTP 500 Internal Server Error response.
 */
public class FileStorageException extends RuntimeException {

    /**
     * Creates a new FileStorageException with the given message.
     *
     * @param message the detail message
     */
    public FileStorageException(String message) {
        super(message);
    }

    /**
     * Creates a new FileStorageException with the given message and underlying cause.
     *
     * @param message the detail message
     * @param cause   the root cause of the exception
     */
    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
