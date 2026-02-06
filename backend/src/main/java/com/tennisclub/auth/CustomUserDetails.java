package com.tennisclub.auth;

import com.tennisclub.model.AccountStatus;
import com.tennisclub.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Custom implementation of Spring Security's {@link UserDetails} that wraps
 * the application's {@link User} entity. This bridges the domain model with
 * the security framework, exposing the user's email as the username, the
 * hashed password, and the role as a granted authority.
 */
public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    /**
     * Returns the underlying {@link User} entity.
     *
     * @return the wrapped user entity
     */
    public User getUser() {
        return user;
    }

    /**
     * Returns the unique identifier of the underlying user.
     *
     * @return the user's UUID
     */
    public UUID getId() {
        return user.getId();
    }

    /**
     * Returns a single authority derived from the user's role.
     * For example, a user with {@code Role.ROLE_ADMIN} will have
     * the authority "ROLE_ADMIN".
     *
     * @return a singleton list containing the user's role as a granted authority
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(user.getRole().name()));
    }

    /**
     * Returns the BCrypt-hashed password stored in the user entity.
     *
     * @return the password hash
     */
    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    /**
     * Returns the user's email address, which serves as the unique login identifier.
     *
     * @return the user's email
     */
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    /**
     * Accounts do not expire in this application.
     *
     * @return always {@code true}
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Accounts are never locked through this mechanism; suspension is handled
     * via {@link #isEnabled()}.
     *
     * @return always {@code true}
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Credentials do not expire in this application.
     *
     * @return always {@code true}
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * A user is considered enabled only when their account status is
     * {@link AccountStatus#ATTIVO}. Suspended accounts cannot authenticate.
     *
     * @return {@code true} if the account status is ATTIVO, {@code false} otherwise
     */
    @Override
    public boolean isEnabled() {
        return user.getAccountStatus() == AccountStatus.ATTIVO;
    }
}
