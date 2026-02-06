package com.tennisclub.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for user profile responses.
 * Represents the public-facing view of a user account.
 */
public record UserResponse(

        UUID id,

        String username,

        String email,

        String role,

        String accountStatus,

        LocalDateTime createdAt

) {
}
