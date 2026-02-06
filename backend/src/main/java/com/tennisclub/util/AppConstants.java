package com.tennisclub.util;

import java.util.List;

/**
 * Application-wide constants.
 *
 * All values are static final so they can be referenced anywhere without
 * creating an instance.  Configuration values that may change between
 * environments belong in application.properties instead.
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class -- prevent instantiation
    }

    // --- Reservation ---

    /** Default duration of a single court time-slot in minutes. */
    public static final int DEFAULT_SLOT_DURATION_MINUTES = 60;

    // --- Court Photos ---

    /** Maximum number of photos that can be attached to a single court. */
    public static final int MAX_PHOTOS_PER_COURT = 5;

    /** File extensions accepted for image uploads (lower-case, without dot). */
    public static final List<String> ALLOWED_IMAGE_EXTENSIONS = List.of(
            "jpg", "jpeg", "png", "webp"
    );

    /** Maximum allowed size for a single image upload, in bytes (2 MB). */
    public static final long MAX_IMAGE_SIZE_BYTES = 2L * 1024 * 1024;
}
