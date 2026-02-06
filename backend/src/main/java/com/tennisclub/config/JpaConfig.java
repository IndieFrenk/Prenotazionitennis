package com.tennisclub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA configuration that enables auditing support.
 *
 * With auditing enabled, entity fields annotated with {@code @CreatedDate},
 * {@code @LastModifiedDate}, {@code @CreatedBy}, and {@code @LastModifiedBy}
 * are automatically populated by the persistence layer.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // Auditing is activated by the @EnableJpaAuditing annotation.
    // If you need a custom AuditorAware bean (e.g. to fill @CreatedBy with
    // the currently authenticated user), register it here.
}
