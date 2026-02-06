package com.tennisclub.service;

import com.tennisclub.dto.ContactInfoRequest;
import com.tennisclub.dto.ContactInfoResponse;
import com.tennisclub.model.ContactInfo;
import com.tennisclub.repository.ContactInfoRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service layer for managing the club's contact information.
 * The contact info table is treated as a singleton record: there is at most
 * one row, which is created on first update if it does not yet exist.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ContactInfoService {

    private static final Logger log = LoggerFactory.getLogger(ContactInfoService.class);

    private final ContactInfoRepository contactInfoRepository;

    /**
     * Retrieves the club's contact information.
     * If no record exists, returns an empty/default response with all fields null.
     *
     * @return the contact info response DTO
     */
    @Transactional(readOnly = true)
    public ContactInfoResponse getContactInfo() {
        return contactInfoRepository.findAll().stream()
                .findFirst()
                .map(this::mapToResponse)
                .orElse(new ContactInfoResponse(
                        null, null, null, null, null, null, null, null));
    }

    /**
     * Updates (or creates) the club's contact information.
     * If a record already exists, it is updated with the new values.
     * If no record exists, a new one is created.
     *
     * @param request the contact info update request DTO
     * @return the updated contact info response DTO
     */
    public ContactInfoResponse updateContactInfo(ContactInfoRequest request) {
        ContactInfo contactInfo = contactInfoRepository.findAll().stream()
                .findFirst()
                .orElseGet(ContactInfo::new);

        contactInfo.setAddress(request.address());
        contactInfo.setPhone(request.phone());
        contactInfo.setEmail(request.email());
        contactInfo.setOpeningHours(request.openingHours());
        contactInfo.setWelcomeMessage(request.welcomeMessage());
        contactInfo.setLatitude(request.latitude());
        contactInfo.setLongitude(request.longitude());

        ContactInfo saved = contactInfoRepository.save(contactInfo);
        log.info("Contact info updated");
        return mapToResponse(saved);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Maps a ContactInfo entity to a ContactInfoResponse DTO.
     */
    private ContactInfoResponse mapToResponse(ContactInfo info) {
        return new ContactInfoResponse(
                info.getAddress(),
                info.getPhone(),
                info.getEmail(),
                info.getOpeningHours(),
                info.getWelcomeMessage(),
                info.getLatitude(),
                info.getLongitude(),
                info.getUpdatedAt()
        );
    }
}
