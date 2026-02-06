package com.tennisclub.exception;

import com.tennisclub.dto.ApiError;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Centralized exception handler for the entire application.
 * <p>
 * Catches exceptions thrown by controllers and services, maps them to appropriate
 * HTTP status codes, and returns a consistent {@link ApiError} response body.
 * All user-facing messages are in Italian. Sensitive data (tokens, passwords, etc.)
 * is never logged.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // -- Custom application exceptions -----------------------------------------------------------

    /**
     * Handles resource-not-found errors.
     *
     * @param ex the exception
     * @return 404 Not Found with the exception message
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Risorsa non trovata: {}", ex.getMessage());
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Handles bad-request errors raised explicitly by application code.
     *
     * @param ex the exception
     * @return 400 Bad Request with the exception message
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex) {
        log.warn("Richiesta non valida: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Handles duplicate-resource conflicts.
     *
     * @param ex the exception
     * @return 409 Conflict with the exception message
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiError> handleDuplicateResource(DuplicateResourceException ex) {
        log.warn("Risorsa duplicata: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    /**
     * Handles unauthorized access when credentials are missing or invalid.
     *
     * @param ex the exception
     * @return 401 Unauthorized with the exception message
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Accesso non autorizzato: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    /**
     * Handles forbidden access when the user lacks sufficient permissions.
     *
     * @param ex the exception
     * @return 403 Forbidden with the exception message
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex) {
        log.warn("Accesso vietato: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    /**
     * Handles attempts to login without verified email.
     *
     * @param ex the exception
     * @return 403 Forbidden with the exception message
     */
    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ApiError> handleEmailNotVerified(EmailNotVerifiedException ex) {
        log.warn("Login con email non verificata: {}", ex.getMessage());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    /**
     * Handles file storage errors (upload, download, deletion failures).
     *
     * @param ex the exception
     * @return 500 Internal Server Error with the exception message
     */
    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiError> handleFileStorage(FileStorageException ex) {
        log.error("Errore di archiviazione file: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
    }

    // -- Standard Java / Spring exceptions -------------------------------------------------------

    /**
     * Handles illegal argument errors (e.g. invalid enum values, null checks).
     *
     * @param ex the exception
     * @return 400 Bad Request with the exception message
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Argomento non valido: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Handles Bean Validation failures on {@code @Valid} annotated request bodies.
     * Extracts every field error into a list of "field: message" strings.
     *
     * @param ex the exception
     * @return 400 Bad Request with field-level error details
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(GlobalExceptionHandler::formatFieldError)
                .toList();

        log.warn("Validazione fallita: {}", fieldErrors);

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Validazione fallita",
                LocalDateTime.now(),
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    /**
     * Handles Jakarta Bean Validation constraint violations (e.g. {@code @PathVariable},
     * {@code @RequestParam} validations).
     *
     * @param ex the exception
     * @return 400 Bad Request with violation details
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> violations = ex.getConstraintViolations()
                .stream()
                .map(GlobalExceptionHandler::formatConstraintViolation)
                .toList();

        log.warn("Vincolo violato: {}", violations);

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST.value(),
                "Validazione fallita",
                LocalDateTime.now(),
                violations
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    /**
     * Handles unreadable HTTP request bodies (malformed JSON, wrong content-type, etc.).
     *
     * @param ex the exception
     * @return 400 Bad Request
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Corpo della richiesta non leggibile: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Corpo della richiesta non valido");
    }

    /**
     * Handles multipart file uploads that exceed the configured size limit.
     *
     * @param ex the exception
     * @return 413 Payload Too Large
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        log.warn("Dimensione file superata: {}", ex.getMessage());
        return buildResponse(HttpStatus.PAYLOAD_TOO_LARGE, "Il file supera la dimensione massima consentita");
    }

    // -- Spring Security exceptions ---------------------------------------------------------------

    /**
     * Handles Spring Security access-denied errors (authenticated but insufficient privileges).
     *
     * @param ex the exception
     * @return 403 Forbidden
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Accesso negato");
        return buildResponse(HttpStatus.FORBIDDEN, "Accesso negato");
    }

    /**
     * Handles Spring Security bad-credentials errors (wrong username/password).
     *
     * @param ex the exception
     * @return 401 Unauthorized
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Credenziali non valide");
        return buildResponse(HttpStatus.UNAUTHORIZED, "Credenziali non valide");
    }

    /**
     * Handles any other Spring Security authentication failure.
     * This handler is ordered after {@link BadCredentialsException} because
     * {@code BadCredentialsException} is a subclass of {@code AuthenticationException}.
     *
     * @param ex the exception
     * @return 401 Unauthorized
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex) {
        log.warn("Autenticazione richiesta");
        return buildResponse(HttpStatus.UNAUTHORIZED, "Autenticazione richiesta");
    }

    // -- Generic catch-all -----------------------------------------------------------------------

    /**
     * Catches any unhandled exception. The actual error is logged at ERROR level,
     * but a generic message is returned to the client to avoid leaking internal details.
     *
     * @param ex the exception
     * @return 500 Internal Server Error with a generic Italian message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex) {
        log.error("Errore interno non gestito", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno del server");
    }

    // -- Helper methods --------------------------------------------------------------------------

    /**
     * Builds a simple {@link ResponseEntity} wrapping an {@link ApiError} with no field-level errors.
     *
     * @param status  the HTTP status
     * @param message the user-facing message
     * @return a fully formed ResponseEntity
     */
    private ResponseEntity<ApiError> buildResponse(HttpStatus status, String message) {
        ApiError apiError = new ApiError(status.value(), message);
        return ResponseEntity.status(status).body(apiError);
    }

    /**
     * Formats a Spring {@link FieldError} into a human-readable "field: message" string.
     *
     * @param fieldError the field error
     * @return formatted string
     */
    private static String formatFieldError(FieldError fieldError) {
        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
    }

    /**
     * Formats a Jakarta {@link ConstraintViolation} into a human-readable
     * "propertyPath: message" string.
     *
     * @param violation the constraint violation
     * @return formatted string
     */
    private static String formatConstraintViolation(ConstraintViolation<?> violation) {
        return violation.getPropertyPath() + ": " + violation.getMessage();
    }
}
