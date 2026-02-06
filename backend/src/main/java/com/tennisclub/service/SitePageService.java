package com.tennisclub.service;

import com.tennisclub.dto.SitePageRequest;
import com.tennisclub.dto.SitePageResponse;
import com.tennisclub.exception.ResourceNotFoundException;
import com.tennisclub.model.SitePage;
import com.tennisclub.repository.SitePageRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer for managing CMS-style site pages.
 * Handles retrieval and updating of HTML content pages identified by slug.
 * HTML content is sanitized using Jsoup to prevent XSS attacks.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class SitePageService {

    private static final Logger log = LoggerFactory.getLogger(SitePageService.class);

    private final SitePageRepository sitePageRepository;

    /**
     * Finds a site page by its unique slug identifier.
     *
     * @param slug the URL-friendly slug (e.g. "home", "about", "contatti")
     * @return the site page response DTO
     * @throws ResourceNotFoundException if no page with the given slug exists
     */
    @Transactional(readOnly = true)
    public SitePageResponse findBySlug(String slug) {
        SitePage page = sitePageRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Pagina", "slug", slug));
        return mapToResponse(page);
    }

    /**
     * Retrieves all site pages.
     *
     * @return list of all site page response DTOs
     */
    @Transactional(readOnly = true)
    public List<SitePageResponse> findAll() {
        return sitePageRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Updates an existing site page identified by slug.
     * The HTML content is sanitized using Jsoup with a relaxed safelist
     * to allow common formatting tags while stripping potentially harmful markup.
     *
     * @param slug    the slug of the page to update
     * @param request the update request containing the new title and HTML content
     * @return the updated site page response DTO
     * @throws ResourceNotFoundException if no page with the given slug exists
     */
    public SitePageResponse update(String slug, SitePageRequest request) {
        SitePage page = sitePageRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Pagina", "slug", slug));

        page.setTitle(request.title());

        // Sanitize HTML content to prevent XSS attacks
        if (request.contentHtml() != null) {
            String sanitized = Jsoup.clean(request.contentHtml(), Safelist.relaxed());
            page.setContentHtml(sanitized);
        }

        SitePage saved = sitePageRepository.save(page);
        log.info("Site page updated: {}", slug);
        return mapToResponse(saved);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Maps a SitePage entity to a SitePageResponse DTO.
     */
    private SitePageResponse mapToResponse(SitePage page) {
        return new SitePageResponse(
                page.getId(),
                page.getSlug(),
                page.getTitle(),
                page.getContentHtml(),
                page.getUpdatedAt()
        );
    }
}
