import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '@app/core/models/user.model';

/** Keys used for persisting auth data in localStorage. */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'current_user'
} as const;

/**
 * Central authentication service.
 * Manages JWT tokens, current user state, login, registration, and logout flows.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  /** BehaviorSubject holding the currently authenticated user (or null). */
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());

  /** Observable stream of the current user. */
  readonly currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  /** Observable that emits true when a user is logged in. */
  readonly isLoggedIn$: Observable<boolean> = new Observable<boolean>(subscriber => {
    this.currentUser$.subscribe(user => subscriber.next(user !== null));
  });

  /**
   * Authenticate with email and password.
   * Stores tokens and updates the current user on success.
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        this.storeTokens(response);
        const user = this.decodeToken(response.accessToken);
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  /**
   * Register a new account.
   * Returns a message indicating that verification email was sent.
   */
  register(request: RegisterRequest): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(`${this.apiUrl}/auth/register`, request);
  }

  /**
   * Verify email address using the provided token.
   */
  verifyEmail(token: string): Observable<{ messaggio: string }> {
    return this.http.get<{ messaggio: string }>(`${this.apiUrl}/auth/verify-email`, {
      params: { token }
    });
  }

  /**
   * Resend verification email to the specified email address.
   */
  resendVerificationEmail(email: string): Observable<{ messaggio: string }> {
    return this.http.post<{ messaggio: string }>(`${this.apiUrl}/auth/resend-verification`, { email });
  }

  /**
   * Log out the current user.
   * Sends the refresh token to the server, clears local storage, and navigates to login.
   */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).pipe(
        catchError(() => EMPTY)
      ).subscribe();
    }
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Request a new access token using the stored refresh token.
   * Updates the access token in localStorage on success.
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        }
      })
    );
  }

  /** Retrieve the stored access token. */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /** Retrieve the stored refresh token. */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check whether the user is authenticated.
   * Returns true only if a token exists and has not expired.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  /** Check if the current user has the specified role. */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.role === role;
  }

  /** Shorthand check for admin role. */
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  /** Shorthand check for member role. */
  isMember(): boolean {
    return this.hasRole('ROLE_MEMBER');
  }

  /** Return the current user value synchronously. */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Update the locally cached user data.
   * Useful after profile updates so the header reflects changes immediately.
   */
  updateCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Decode a JWT token and extract the user info from the payload.
   * The JWT structure is: sub=email, userId=UUID, role=role
   * Returns null if the token cannot be decoded.
   */
  private decodeToken(token: string): User | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        id: decoded.userId ?? '',
        username: decoded.sub?.split('@')[0] ?? '', // Extract username from email
        email: decoded.sub ?? '',
        role: decoded.role ?? '',
        accountStatus: 'ATTIVO',
        createdAt: ''
      };
    } catch {
      return null;
    }
  }

  /** Persist both tokens to localStorage. */
  private storeTokens(response: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
  }

  /** Remove all auth-related entries from localStorage. */
  private clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /** Attempt to restore the user object from localStorage on startup. */
  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      return null;
    }
    try {
      const user: User = JSON.parse(raw);
      // Also verify the token is still present and not expired
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token || this.isTokenExpired(token)) {
        this.clearTokens();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  /** Check whether a JWT token has expired based on the `exp` claim. */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      if (!decoded.exp) {
        return false;
      }
      // exp is in seconds; Date.now() is in milliseconds
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
