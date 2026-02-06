/**
 * Reservation-related interfaces for booking management.
 */

/** Represents a court reservation with full details. */
export interface Reservation {
  id: string;
  userId: string;
  username: string;
  courtId: string;
  courtName: string;
  courtType: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paidPrice: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new reservation. */
export interface ReservationRequest {
  courtId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

/** A single bookable time slot within a day schedule. */
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reservationId: string | null;
}

/** The full schedule of time slots for a specific court on a specific date. */
export interface DaySchedule {
  date: string;
  courtId: string;
  courtName: string;
  slots: TimeSlot[];
}
