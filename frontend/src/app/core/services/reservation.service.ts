import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Reservation, ReservationRequest } from '@app/core/models/reservation.model';
import { PagedResponse } from '@app/core/models/common.model';

/**
 * Parameters for querying reservations in the admin panel.
 */
export interface ReservationQueryParams {
  courtId?: string;
  date?: string;
  status?: string;
  page: number;
  size: number;
}

/**
 * Service for creating, cancelling, and retrieving reservations.
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ---------------------------------------------------------------------------
  // Authenticated user endpoints
  // ---------------------------------------------------------------------------

  /** Create a new reservation. */
  createReservation(request: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/reservations`, request);
  }

  /** Cancel one of the authenticated user's reservations. */
  cancelReservation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reservations/${id}`);
  }

  /** Get the authenticated user's reservations (paginated). */
  getMyReservations(page: number, size: number): Observable<PagedResponse<Reservation>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<Reservation>>(`${this.apiUrl}/reservations/me`, { params });
  }

  // ---------------------------------------------------------------------------
  // Admin endpoints
  // ---------------------------------------------------------------------------

  /** Retrieve all reservations with optional filters (admin only). */
  getAllReservations(queryParams: ReservationQueryParams): Observable<PagedResponse<Reservation>> {
    let params = new HttpParams()
      .set('page', queryParams.page.toString())
      .set('size', queryParams.size.toString());

    if (queryParams.courtId) {
      params = params.set('courtId', queryParams.courtId);
    }
    if (queryParams.date) {
      params = params.set('date', queryParams.date);
    }
    if (queryParams.status) {
      params = params.set('status', queryParams.status);
    }

    return this.http.get<PagedResponse<Reservation>>(`${this.apiUrl}/admin/reservations`, { params });
  }

  /** Cancel any reservation (admin only). */
  adminCancelReservation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/reservations/${id}`);
  }

  /** Update the status of a reservation (admin only). */
  updateReservationStatus(id: string, status: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/admin/reservations/${id}/status`, { status });
  }
}
