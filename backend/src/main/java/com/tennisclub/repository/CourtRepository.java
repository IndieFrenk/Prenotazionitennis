package com.tennisclub.repository;

import com.tennisclub.model.Court;
import com.tennisclub.model.CourtStatus;
import com.tennisclub.model.CourtType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link Court} entity.
 * Provides filtered and ordered lookups used for the public court listing
 * and the admin management pages.
 */
@Repository
public interface CourtRepository extends JpaRepository<Court, UUID> {

    /**
     * Find courts that have a specific status, ordered by display order ascending.
     *
     * @param status the court status to filter by
     * @return ordered list of courts matching the given status
     */
    List<Court> findByStatusOrderByDisplayOrderAsc(CourtStatus status);

    /**
     * Retrieve all courts ordered by their display order.
     *
     * @return ordered list of all courts
     */
    List<Court> findAllByOrderByDisplayOrderAsc();

    /**
     * Find courts filtered by type and status, ordered by display order ascending.
     * Useful for the public-facing listing where only active courts of a specific
     * type (e.g. TENNIS or PADEL) should be shown.
     *
     * @param type   the court type to filter by
     * @param status the court status to filter by
     * @return ordered list of matching courts
     */
    List<Court> findByTypeAndStatusOrderByDisplayOrderAsc(CourtType type, CourtStatus status);

    /**
     * Check whether a court with the given name already exists (case-insensitive).
     * Used during court creation to prevent duplicate names.
     *
     * @param name the court name to check
     * @return true if a court with that name exists
     */
    boolean existsByNameIgnoreCase(String name);
}
