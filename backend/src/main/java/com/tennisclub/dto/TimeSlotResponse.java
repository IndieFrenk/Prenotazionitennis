package com.tennisclub.dto;

import java.util.UUID;

/**
 * DTO representing a single time slot within a court's daily schedule.
 * Used to display availability in the booking calendar.
 * The reservationId is present only when the slot is already booked.
 */
public record TimeSlotResponse(

        String startTime,

        String endTime,

        boolean available,

        UUID reservationId

) {
}
