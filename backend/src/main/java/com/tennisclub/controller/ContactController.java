package com.tennisclub.controller;

import com.tennisclub.dto.ContactFormRequest;
import com.tennisclub.dto.ContactInfoRequest;
import com.tennisclub.dto.ContactInfoResponse;
import com.tennisclub.service.ContactInfoService;
import com.tennisclub.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller for contact information and contact form submissions.
 * Provides public endpoints for viewing contact info and sending messages,
 * and an admin endpoint for updating the club's contact details.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ContactController {

    private final ContactInfoService contactInfoService;
    private final EmailService emailService;

    // -----------------------------------------------------------------------
    // Public endpoints
    // -----------------------------------------------------------------------

    /**
     * Retrieves the club's contact information.
     *
     * @return the contact information (address, phone, email, etc.)
     */
    @GetMapping("/public/contact")
    public ResponseEntity<ContactInfoResponse> getContactInfo() {
        ContactInfoResponse response = contactInfoService.getContactInfo();
        return ResponseEntity.ok(response);
    }

    /**
     * Sends a contact form email to the club.
     *
     * @param request the contact form data (name, email, message)
     * @return a confirmation message
     */
    @PostMapping("/public/contact/send")
    public ResponseEntity<Map<String, String>> sendContactForm(
            @Valid @RequestBody ContactFormRequest request) {
        emailService.sendContactFormEmail(request);
        return ResponseEntity.ok(
                Map.of("messaggio", "Messaggio inviato con successo. Ti risponderemo al piu' presto."));
    }

    // -----------------------------------------------------------------------
    // Admin endpoints
    // -----------------------------------------------------------------------

    /**
     * Updates the club's contact information.
     * Restricted to administrators.
     *
     * @param request the updated contact information
     * @return the updated contact info
     */
    @PutMapping("/admin/contact")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactInfoResponse> updateContactInfo(
            @Valid @RequestBody ContactInfoRequest request) {
        ContactInfoResponse response = contactInfoService.updateContactInfo(request);
        return ResponseEntity.ok(response);
    }
}
