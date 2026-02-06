package com.tennisclub.service;

import com.tennisclub.dto.ChangePasswordRequest;
import com.tennisclub.dto.PagedResponse;
import com.tennisclub.dto.UserResponse;
import com.tennisclub.exception.BadRequestException;
import com.tennisclub.exception.ResourceNotFoundException;
import com.tennisclub.model.AccountStatus;
import com.tennisclub.model.Role;
import com.tennisclub.model.User;
import com.tennisclub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service layer for user management operations.
 * Handles profile retrieval, search, role updates, account status toggling,
 * profile editing, and password changes.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieves a paginated list of all users.
     *
     * @param pageable pagination and sorting parameters
     * @return a paged response containing user DTOs
     */
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> findAll(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        return buildPagedResponse(page);
    }

    /**
     * Finds a single user by their unique identifier.
     *
     * @param userId the UUID of the user
     * @return the user response DTO
     * @throws ResourceNotFoundException if no user with the given id exists
     */
    @Transactional(readOnly = true)
    public UserResponse findById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", userId));
        return mapToUserResponse(user);
    }

    /**
     * Searches users by username or email using a case-insensitive partial match.
     *
     * @param query    the search term applied to both username and email
     * @param pageable pagination and sorting parameters
     * @return a paged response of matching users
     */
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> search(String query, Pageable pageable) {
        Page<User> page = userRepository
                .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable);
        return buildPagedResponse(page);
    }

    /**
     * Updates the role of a user. Only administrators should invoke this method.
     * The role string is validated against the {@link Role} enum.
     *
     * @param userId the UUID of the user whose role will be updated
     * @param role   the new role as a string (e.g. "ROLE_USER", "ROLE_MEMBER", "ROLE_ADMIN")
     * @return the updated user response DTO
     * @throws ResourceNotFoundException if no user with the given id exists
     * @throws BadRequestException       if the role string is not a valid Role value
     */
    public UserResponse updateUserRole(UUID userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", userId));

        Role newRole;
        try {
            newRole = Role.valueOf(role);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Ruolo non valido: " + role);
        }

        user.setRole(newRole);
        User saved = userRepository.save(user);
        log.info("Role updated for user {} to {}", userId, newRole);
        return mapToUserResponse(saved);
    }

    /**
     * Toggles the account status of a user between ATTIVO and SOSPESO.
     *
     * @param userId the UUID of the user
     * @return the updated user response DTO
     * @throws ResourceNotFoundException if no user with the given id exists
     */
    public UserResponse toggleAccountStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", userId));

        AccountStatus newStatus = (user.getAccountStatus() == AccountStatus.ATTIVO)
                ? AccountStatus.SOSPESO
                : AccountStatus.ATTIVO;

        user.setAccountStatus(newStatus);
        User saved = userRepository.save(user);
        log.info("Account status toggled for user {} to {}", userId, newStatus);
        return mapToUserResponse(saved);
    }

    /**
     * Updates the profile information (username) for a user.
     *
     * @param userId   the UUID of the user
     * @param username the new username
     * @return the updated user response DTO
     * @throws ResourceNotFoundException if no user with the given id exists
     * @throws BadRequestException       if the username is blank
     */
    public UserResponse updateProfile(UUID userId, String username) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", userId));

        if (username == null || username.isBlank()) {
            throw new BadRequestException("Il nome utente non puo' essere vuoto");
        }

        user.setUsername(username.trim());
        User saved = userRepository.save(user);
        log.info("Profile updated for user {}", userId);
        return mapToUserResponse(saved);
    }

    /**
     * Changes the password for a user after validating the old password and
     * confirming that the new password and its confirmation match.
     *
     * @param userId  the UUID of the user
     * @param request the change-password request containing old, new, and confirm passwords
     * @throws ResourceNotFoundException if no user with the given id exists
     * @throws BadRequestException       if the old password is incorrect or passwords do not match
     */
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utente", "id", userId));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("La password attuale non e' corretta");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("La nuova password e la conferma non coincidono");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password changed for user {}", userId);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Maps a User entity to a UserResponse DTO.
     */
    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getAccountStatus().name(),
                user.getCreatedAt()
        );
    }

    /**
     * Builds a PagedResponse from a Spring Data Page of users.
     */
    private PagedResponse<UserResponse> buildPagedResponse(Page<User> page) {
        var responses = page.getContent().stream()
                .map(this::mapToUserResponse)
                .toList();

        return new PagedResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
