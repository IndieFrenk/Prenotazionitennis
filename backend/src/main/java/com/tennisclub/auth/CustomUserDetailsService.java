package com.tennisclub.auth;

import com.tennisclub.model.AccountStatus;
import com.tennisclub.model.User;
import com.tennisclub.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom implementation of Spring Security's {@link UserDetailsService}.
 * Loads user-specific data from the database using the email address as the
 * unique identifier. This service is automatically discovered by Spring
 * Security's authentication manager.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads a user by their email address. The {@code username} parameter corresponds
     * to the user's email in this application.
     *
     * @param email the email address used to look up the user
     * @return a fully populated {@link CustomUserDetails} instance
     * @throws UsernameNotFoundException if no user is found with the given email
     *                                    or if the account has been suspended
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));

        if (user.getAccountStatus() == AccountStatus.SOSPESO) {
            throw new UsernameNotFoundException(
                    "Account is suspended for email: " + email);
        }

        return new CustomUserDetails(user);
    }
}
