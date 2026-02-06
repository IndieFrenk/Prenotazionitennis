/**
 * Court-related interfaces for court management and display.
 */

/** Represents a tennis court with its configuration and photos. */
export interface Court {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  basePrice: number;
  memberPrice: number;
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  displayOrder: number;
  photos: CourtPhoto[];
}

/** A photo associated with a court. */
export interface CourtPhoto {
  id: string;
  imageUrl: string;
  displayOrder: number;
  altText: string;
}

/** Payload for creating or updating a court. */
export interface CourtRequest {
  name: string;
  type: string;
  description?: string;
  basePrice: number;
  memberPrice: number;
  openingTime: string;
  closingTime: string;
  slotDurationMinutes?: number;
  displayOrder?: number;
  status?: string;
}
