package com.tennisclub.repository;

import com.tennisclub.model.SitePage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link SitePage} entity.
 * Provides slug-based lookup for retrieving individual content pages.
 */
@Repository
public interface SitePageRepository extends JpaRepository<SitePage, UUID> {

    /**
     * Find a content page by its unique slug identifier (e.g. "home", "about").
     *
     * @param slug the URL-friendly slug of the page
     * @return an Optional containing the page if found
     */
    Optional<SitePage> findBySlug(String slug);
}
