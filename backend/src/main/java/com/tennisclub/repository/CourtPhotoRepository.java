package com.tennisclub.repository;

import com.tennisclub.model.CourtPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link CourtPhoto} entity.
 * Manages the photo gallery associated with each court.
 */
@Repository
public interface CourtPhotoRepository extends JpaRepository<CourtPhoto, UUID> {

    /**
     * Retrieve all photos for a specific court, ordered by display order ascending.
     *
     * @param courtId the UUID of the court
     * @return ordered list of photos belonging to the court
     */
    List<CourtPhoto> findByCourtIdOrderByDisplayOrderAsc(UUID courtId);

    /**
     * Count the number of photos associated with a specific court.
     *
     * @param courtId the UUID of the court
     * @return the photo count
     */
    long countByCourtId(UUID courtId);

    /**
     * Delete all photos associated with a specific court.
     * Typically called when a court is being removed or its gallery is being reset.
     *
     * @param courtId the UUID of the court whose photos should be deleted
     */
    void deleteByCourtId(UUID courtId);
}
