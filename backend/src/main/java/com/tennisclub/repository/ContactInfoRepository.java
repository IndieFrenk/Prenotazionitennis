package com.tennisclub.repository;

import com.tennisclub.model.ContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link ContactInfo} entity.
 * No custom query methods are defined; the service layer is expected to use
 * {@code findAll().stream().findFirst()} to retrieve the single configuration row.
 */
@Repository
public interface ContactInfoRepository extends JpaRepository<ContactInfo, UUID> {
    // No custom query methods needed.
    // Usage: findAll().stream().findFirst() to retrieve the single contact info record.
}
