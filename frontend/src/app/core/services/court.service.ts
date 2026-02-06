import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { Court, CourtRequest, CourtPhoto } from '@app/core/models/court.model';
import { DaySchedule } from '@app/core/models/reservation.model';

/**
 * Service for court retrieval (public) and court management (admin).
 * Implements caching for frequently accessed data.
 */
@Injectable({ providedIn: 'root' })
export class CourtService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Cached active courts observable. */
  private activeCourtsCache$: Observable<Court[]> | null = null;

  /** Cache for individual court by ID. */
  private courtCache = new Map<string, Observable<Court>>();

  // ---------------------------------------------------------------------------
  // Public endpoints
  // ---------------------------------------------------------------------------

  /** Fetch all active courts, optionally filtered by type (cached when no filter). */
  getActiveCourts(type?: string): Observable<Court[]> {
    // Only cache when no type filter is applied
    if (!type) {
      if (!this.activeCourtsCache$) {
        this.activeCourtsCache$ = this.http.get<Court[]>(`${this.apiUrl}/public/courts`).pipe(
          shareReplay({ bufferSize: 1, refCount: true })
        );
      }
      return this.activeCourtsCache$;
    }

    // For filtered requests, don't cache
    const params = new HttpParams().set('type', type);
    return this.http.get<Court[]>(`${this.apiUrl}/public/courts`, { params });
  }

  /** Get a single court by ID (cached). */
  getCourtById(id: string): Observable<Court> {
    if (!this.courtCache.has(id)) {
      const court$ = this.http.get<Court>(`${this.apiUrl}/public/courts/${id}`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.courtCache.set(id, court$);
    }
    return this.courtCache.get(id)!;
  }

  /** Clear cache (call after admin updates). */
  clearCache(): void {
    this.activeCourtsCache$ = null;
    this.courtCache.clear();
  }

  /** Fetch the day schedule (time slots) for a court on a given date. */
  getDaySchedule(courtId: string, date: string): Observable<DaySchedule> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DaySchedule>(`${this.apiUrl}/public/courts/${courtId}/schedule`, { params });
  }

  /** Fetch the week schedule for a court starting from a given date. */
  getWeekSchedule(courtId: string, startDate: string): Observable<DaySchedule[]> {
    const params = new HttpParams().set('startDate', startDate);
    return this.http.get<DaySchedule[]>(`${this.apiUrl}/public/courts/${courtId}/week-schedule`, { params });
  }

  // ---------------------------------------------------------------------------
  // Admin endpoints
  // ---------------------------------------------------------------------------

  /** Fetch ALL courts regardless of status (for admin management). */
  getAllCourts(): Observable<Court[]> {
    return this.http.get<Court[]>(`${this.apiUrl}/admin/courts`);
  }

  /** Create a new court (admin only). */
  createCourt(request: CourtRequest): Observable<Court> {
    return this.http.post<Court>(`${this.apiUrl}/admin/courts`, request);
  }

  /** Update an existing court (admin only). */
  updateCourt(id: string, request: CourtRequest): Observable<Court> {
    return this.http.put<Court>(`${this.apiUrl}/admin/courts/${id}`, request);
  }

  /** Delete a court (admin only). */
  deleteCourt(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/courts/${id}`);
  }

  /** Update the display order of a court (admin only). */
  updateDisplayOrder(id: string, order: number): Observable<Court> {
    return this.http.put<Court>(`${this.apiUrl}/admin/courts/${id}/order`, { displayOrder: order });
  }

  /**
   * Upload a photo for a court (admin only).
   * Sends the file as multipart/form-data.
   */
  uploadPhoto(courtId: string, file: File, displayOrder: number, altText: string): Observable<CourtPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('displayOrder', displayOrder.toString());
    formData.append('altText', altText);
    return this.http.post<CourtPhoto>(`${this.apiUrl}/admin/courts/${courtId}/photos`, formData);
  }

  /** Delete a court photo (admin only). */
  deletePhoto(photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/courts/photos/${photoId}`);
  }

  /** Update the display order of a court photo (admin only). */
  updatePhotoOrder(photoId: string, order: number): Observable<CourtPhoto> {
    return this.http.put<CourtPhoto>(
      `${this.apiUrl}/admin/courts/photos/${photoId}/order`,
      { displayOrder: order }
    );
  }
}
