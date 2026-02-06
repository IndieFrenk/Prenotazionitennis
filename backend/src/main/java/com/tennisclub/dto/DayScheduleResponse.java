package com.tennisclub.dto;

import java.util.List;
import java.util.UUID;

/**
 * DTO representing the full daily schedule for a specific court.
 * Contains all time slots for a given date, each indicating its availability.
 */
public record DayScheduleResponse(

        String date,

        UUID courtId,

        String courtName,

        List<TimeSlotResponse> slots

) {
}
