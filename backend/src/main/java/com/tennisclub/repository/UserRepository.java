package com.tennisclub.repository;

import com.tennisclub.model.Role;
import com.tennisclub.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link User} entity.
 * Provides lookup methods by email, role, and paginated search by username or email.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find a user by their email address.
     *
     * @param email the email address to search for
     * @return an Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check whether a user with the given email address already exists.
     *
     * @param email the email address to check
     * @return true if a user with that email exists
     */
    boolean existsByEmail(String email);

    /**
     * Paginated search for users whose username or email contains the given text
     * (case-insensitive). Both parameters are typically set to the same search term
     * so that a single keyword matches against either field.
     *
     * @param username the search term matched against the username field
     * @param email    the search term matched against the email field
     * @param pageable pagination and sorting information
     * @return a page of matching users
     */
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String username, String email, Pageable pageable);

    /**
     * Retrieve all users that have the specified role.
     *
     * @param role the role to filter by
     * @return list of users with the given role
     */
    List<User> findByRole(Role role);
}
