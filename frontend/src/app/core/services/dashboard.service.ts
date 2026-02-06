import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DashboardStats } from '@app/core/models/common.model';

/**
 * Service for retrieving admin dashboard statistics.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetch dashboard statistics with optional date range filtering.
   * @param fromDate - Start date in ISO format (e.g. '2025-01-01')
   * @param toDate   - End date in ISO format (e.g. '2025-01-31')
   */
  getStats(fromDate?: string, toDate?: string): Observable<DashboardStats> {
    let params = new HttpParams();
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`, { params });
  }
}
