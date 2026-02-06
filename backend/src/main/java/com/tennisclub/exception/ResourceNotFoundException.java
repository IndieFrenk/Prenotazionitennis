package com.tennisclub.exception;

/**
 * Thrown when a requested resource cannot be found in the system.
 * Results in an HTTP 404 Not Found response.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Creates a new ResourceNotFoundException with the given message.
     *
     * @param message the detail message
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Creates a new ResourceNotFoundException with a formatted message describing
     * which resource was not found and the field/value used for the lookup.
     * <p>
     * Example: {@code new ResourceNotFoundException("Campo", "id", "xyz")}
     * produces the message "Campo non trovato con id: xyz".
     *
     * @param resourceName the name of the resource (e.g. "Campo", "Utente")
     * @param fieldName    the field used for the lookup (e.g. "id", "email")
     * @param fieldValue   the value that was searched for
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s non trovato con %s: %s", resourceName, fieldName, fieldValue));
    }
}
