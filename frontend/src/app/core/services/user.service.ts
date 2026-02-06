import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { User, ChangePasswordRequest } from '@app/core/models/user.model';
import { PagedResponse } from '@app/core/models/common.model';

/**
 * Service for user profile management and admin user operations.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ---------------------------------------------------------------------------
  // Authenticated user endpoints
  // ---------------------------------------------------------------------------

  /** Fetch the currently authenticated user's profile. */
  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  /** Update the authenticated user's username. */
  updateProfile(username: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, { username });
  }

  /** Change the authenticated user's password. */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/me/password`, request);
  }

  // ---------------------------------------------------------------------------
  // Admin user management endpoints
  // ---------------------------------------------------------------------------

  /** Retrieve a paginated list of users (admin only). */
  getUsers(page: number, size: number, search?: string): Observable<PagedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedResponse<User>>(`${this.apiUrl}/admin/users`, { params });
  }

  /** Get a single user by ID (admin only). */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/admin/users/${id}`);
  }

  /** Update a user's role (admin only). */
  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${id}/role`, { role });
  }

  /** Toggle a user's active/disabled status (admin only). */
  toggleUserStatus(id: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${id}/toggle-status`, {});
  }
}
