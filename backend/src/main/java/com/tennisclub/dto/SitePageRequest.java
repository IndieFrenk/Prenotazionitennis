package com.tennisclub.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for creating or updating a site page (e.g., About Us, Rules, FAQ).
 * The slug is typically derived from the title at the service level.
 */
public record SitePageRequest(

        @NotBlank(message = "Page title is required")
        String title,

        String contentHtml

) {
}
