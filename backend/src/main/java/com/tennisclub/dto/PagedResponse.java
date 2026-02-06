package com.tennisclub.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Generic wrapper for paginated API responses.
 * Mirrors the structure of Spring's Page interface with a simplified, serialization-friendly format.
 *
 * @param <T> the type of elements in the page
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {

    private List<T> content;

    private int pageNumber;

    private int pageSize;

    private long totalElements;

    private int totalPages;

    private boolean last;
}
