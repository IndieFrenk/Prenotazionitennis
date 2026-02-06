package com.tennisclub.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for site page responses.
 * Represents a CMS-managed page with its rendered HTML content.
 */
public record SitePageResponse(

        UUID id,

        String slug,

        String title,

        String contentHtml,

        LocalDateTime updatedAt

) {
}
