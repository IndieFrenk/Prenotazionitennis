package com.tennisclub.controller;

import com.tennisclub.dto.CourtPhotoResponse;
import com.tennisclub.dto.CourtRequest;
import com.tennisclub.dto.CourtResponse;
import com.tennisclub.service.CourtPhotoService;
import com.tennisclub.service.CourtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for court management.
 * Provides public endpoints for browsing courts and admin endpoints for
 * creating, updating, deleting courts and managing court photos.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourtController {

    private final CourtService courtService;
    private final CourtPhotoService courtPhotoService;

    // -----------------------------------------------------------------------
    // Public endpoints
    // -----------------------------------------------------------------------

    /**
     * Retrieves all active courts, optionally filtered by type.
     *
     * @param type optional court type filter (e.g. "TENNIS", "PADEL")
     * @return the list of matching active courts
     */
    @GetMapping("/public/courts")
    public ResponseEntity<List<CourtResponse>> getPublicCourts(
            @RequestParam(required = false) String type) {
        List<CourtResponse> response;
        if (type != null && !type.isBlank()) {
            response = courtService.findByType(type);
        } else {
            response = courtService.findAllActive();
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a single court by its unique identifier.
     *
     * @param id the UUID of the court
     * @return the court details including photos
     */
    @GetMapping("/public/courts/{id}")
    public ResponseEntity<CourtResponse> getCourtById(@PathVariable UUID id) {
        CourtResponse response = courtService.findById(id);
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // Admin court management
    // -----------------------------------------------------------------------

    /**
     * Retrieves all courts (including those in maintenance).
     * Restricted to administrators.
     *
     * @return the list of all courts ordered by display order
     */
    @GetMapping("/admin/courts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CourtResponse>> getAllCourts() {
        List<CourtResponse> response = courtService.findAll();
        return ResponseEntity.ok(response);
    }

    /**
     * Creates a new court.
     * Restricted to administrators.
     *
     * @param request the court creation data
     * @return the created court with HTTP 201
     */
    @PostMapping("/admin/courts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourtResponse> createCourt(@Valid @RequestBody CourtRequest request) {
        CourtResponse response = courtService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates an existing court.
     * Restricted to administrators.
     *
     * @param id      the UUID of the court to update
     * @param request the updated court data
     * @return the updated court
     */
    @PutMapping("/admin/courts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourtResponse> updateCourt(
            @PathVariable UUID id,
            @Valid @RequestBody CourtRequest request) {
        CourtResponse response = courtService.update(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a court and all its associated photos.
     * Restricted to administrators.
     *
     * @param id the UUID of the court to delete
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/admin/courts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCourt(@PathVariable UUID id) {
        courtService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Updates the display order of a court.
     * Restricted to administrators.
     *
     * @param id    the UUID of the court
     * @param order the new display order value
     * @return HTTP 200 OK
     */
    @PutMapping("/admin/courts/{id}/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateCourtDisplayOrder(
            @PathVariable UUID id,
            @RequestBody Integer order) {
        courtService.updateDisplayOrder(id, order);
        return ResponseEntity.ok().build();
    }

    // -----------------------------------------------------------------------
    // Admin photo management
    // -----------------------------------------------------------------------

    /**
     * Adds a photo to a court.
     * Restricted to administrators.
     *
     * @param courtId      the UUID of the court
     * @param file         the image file to upload
     * @param displayOrder the display order of the photo
     * @param altText      optional alternative text for the photo
     * @return the created photo with HTTP 201
     */
    @PostMapping("/admin/courts/{courtId}/photos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourtPhotoResponse> addPhoto(
            @PathVariable UUID courtId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "displayOrder", defaultValue = "0") int displayOrder,
            @RequestParam(value = "altText", required = false) String altText) {
        CourtPhotoResponse response = courtPhotoService.addPhoto(courtId, file, displayOrder, altText);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Deletes a court photo.
     * Restricted to administrators.
     *
     * @param photoId the UUID of the photo to delete
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/admin/courts/photos/{photoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID photoId) {
        courtPhotoService.deletePhoto(photoId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Updates the display order of a court photo.
     * Restricted to administrators.
     *
     * @param photoId the UUID of the photo
     * @param order   the new display order value
     * @return HTTP 200 OK
     */
    @PutMapping("/admin/courts/photos/{photoId}/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updatePhotoOrder(
            @PathVariable UUID photoId,
            @RequestBody Integer order) {
        courtPhotoService.updatePhotoOrder(photoId, order);
        return ResponseEntity.ok().build();
    }
}
