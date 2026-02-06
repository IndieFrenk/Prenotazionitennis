package com.tennisclub.controller;

import com.tennisclub.dto.SitePageRequest;
import com.tennisclub.dto.SitePageResponse;
import com.tennisclub.service.SitePageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for CMS-style site page management.
 * Provides public endpoints for reading pages and admin endpoints for updating content.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SitePageController {

    private final SitePageService sitePageService;

    // -----------------------------------------------------------------------
    // Public endpoints
    // -----------------------------------------------------------------------

    /**
     * Retrieves a site page by its slug.
     *
     * @param slug the URL-friendly page identifier (e.g. "home", "about")
     * @return the page content
     */
    @GetMapping("/public/pages/{slug}")
    public ResponseEntity<SitePageResponse> getPageBySlug(@PathVariable String slug) {
        SitePageResponse response = sitePageService.findBySlug(slug);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves all site pages.
     *
     * @return the list of all pages
     */
    @GetMapping("/public/pages")
    public ResponseEntity<List<SitePageResponse>> getAllPages() {
        List<SitePageResponse> response = sitePageService.findAll();
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // Admin endpoints
    // -----------------------------------------------------------------------

    /**
     * Updates a site page identified by its slug.
     * HTML content is sanitized server-side to prevent XSS.
     * Restricted to administrators.
     *
     * @param slug    the slug of the page to update
     * @param request the update request containing the new title and HTML content
     * @return the updated page
     */
    @PutMapping("/admin/pages/{slug}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SitePageResponse> updatePage(
            @PathVariable String slug,
            @Valid @RequestBody SitePageRequest request) {
        SitePageResponse response = sitePageService.update(slug, request);
        return ResponseEntity.ok(response);
    }
}
