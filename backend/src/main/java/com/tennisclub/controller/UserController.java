package com.tennisclub.controller;

import com.tennisclub.auth.CustomUserDetails;
import com.tennisclub.dto.ChangePasswordRequest;
import com.tennisclub.dto.PagedResponse;
import com.tennisclub.dto.UserResponse;
import com.tennisclub.dto.UserUpdateRequest;
import com.tennisclub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * REST controller for user management.
 * Provides endpoints for authenticated users to manage their own profile,
 * and for administrators to manage all user accounts.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // -----------------------------------------------------------------------
    // Authenticated user self-management
    // -----------------------------------------------------------------------

    /**
     * Returns the profile of the currently authenticated user.
     *
     * @return the current user's profile data
     */
    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        UserResponse response = userService.findById(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Updates the profile (username) of the currently authenticated user.
     *
     * @param body a map containing the "username" key with the new value
     * @return the updated user profile
     */
    @PutMapping("/users/me")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody Map<String, String> body) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        String username = body.get("username");
        UserResponse response = userService.updateProfile(userDetails.getId(), username);
        return ResponseEntity.ok(response);
    }

    /**
     * Changes the password of the currently authenticated user.
     *
     * @param request the change-password request containing old, new, and confirmation passwords
     * @return a confirmation message
     */
    @PutMapping("/users/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok(
                Map.of("messaggio", "Password modificata con successo"));
    }

    // -----------------------------------------------------------------------
    // Admin user management
    // -----------------------------------------------------------------------

    /**
     * Retrieves a paginated list of all users, with optional search filtering.
     * Restricted to administrators.
     *
     * @param page   the page number (zero-based, default 0)
     * @param size   the page size (default 10)
     * @param search optional search query applied to username and email
     * @return a paginated list of user profiles
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<UserResponse> response;

        if (search != null && !search.isBlank()) {
            response = userService.search(search, pageable);
        } else {
            response = userService.findAll(pageable);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a single user by their unique identifier.
     * Restricted to administrators.
     *
     * @param id the UUID of the user
     * @return the user profile
     */
    @GetMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        UserResponse response = userService.findById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates the role of a user.
     * Restricted to administrators.
     *
     * @param id      the UUID of the user
     * @param request the update request containing the new role
     * @return the updated user profile
     */
    @PutMapping("/admin/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UserUpdateRequest request) {
        UserResponse response = userService.updateUserRole(id, request.role());
        return ResponseEntity.ok(response);
    }

    /**
     * Toggles the account status of a user between ATTIVO and SOSPESO.
     * Restricted to administrators.
     *
     * @param id the UUID of the user
     * @return the updated user profile
     */
    @PutMapping("/admin/users/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleAccountStatus(@PathVariable UUID id) {
        UserResponse response = userService.toggleAccountStatus(id);
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Extracts the current authenticated user details from the security context.
     *
     * @return the CustomUserDetails of the authenticated user
     */
    private CustomUserDetails getCurrentUserDetails() {
        return (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
