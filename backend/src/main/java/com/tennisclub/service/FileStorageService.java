package com.tennisclub.service;

import com.tennisclub.exception.FileStorageException;
import com.tennisclub.util.AppConstants;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Service responsible for storing and deleting files on the local filesystem.
 * Validates file type (extension) and size before persisting, and generates
 * unique filenames to avoid collisions.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    /**
     * Initializes the upload root directory on application startup.
     * Creates the directory structure if it does not yet exist.
     */
    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Upload directory created at {}", uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new FileStorageException("Impossibile creare la directory di upload", e);
        }
    }

    /**
     * Stores a multipart file in the specified subdirectory under the upload root.
     * The file is validated for allowed extensions and maximum size before saving.
     * A unique filename is generated using a UUID prefix.
     *
     * @param file         the multipart file to store
     * @param subdirectory the subdirectory within the upload root (e.g. "courts")
     * @return the relative path of the stored file (e.g. "courts/uuid-filename.jpg")
     * @throws FileStorageException if validation fails or the file cannot be written
     */
    public String storeFile(MultipartFile file, String subdirectory) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new FileStorageException("Il file e' vuoto");
        }

        // Validate file size
        if (file.getSize() > AppConstants.MAX_IMAGE_SIZE_BYTES) {
            throw new FileStorageException(
                    "Il file supera la dimensione massima consentita di "
                    + (AppConstants.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)) + " MB");
        }

        // Extract and validate extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new FileStorageException("Il file non ha un'estensione valida");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        if (!AppConstants.ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new FileStorageException(
                    "Estensione non consentita: " + extension
                    + ". Estensioni ammesse: " + AppConstants.ALLOWED_IMAGE_EXTENSIONS);
        }

        // Generate unique filename
        String uniqueFilename = UUID.randomUUID() + "." + extension;

        try {
            // Ensure subdirectory exists
            Path targetDir = Paths.get(uploadDir, subdirectory);
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // Write the file
            Path targetPath = targetDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = subdirectory + "/" + uniqueFilename;
            log.info("File stored successfully: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            throw new FileStorageException("Errore durante il salvataggio del file", e);
        }
    }

    /**
     * Deletes a file from the filesystem given its relative path within the upload root.
     * Logs a warning if the file is not found (idempotent behavior).
     *
     * @param relativePath the relative path of the file to delete (e.g. "courts/uuid-filename.jpg")
     */
    public void deleteFile(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted: {}", relativePath);
            } else {
                log.warn("File not found for deletion: {}", relativePath);
            }
        } catch (IOException e) {
            log.error("Error deleting file {}: {}", relativePath, e.getMessage());
        }
    }
}
