import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';

/** Endpoints that should not have the Authorization header attached. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

/** Flag to prevent concurrent refresh requests. */
let isRefreshing = false;

/** Subject used to queue requests while a token refresh is in progress. */
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Functional HTTP interceptor that:
 * 1. Attaches the Bearer token to outgoing requests (except auth endpoints).
 * 2. Handles 401 responses by attempting a token refresh.
 * 3. Queues parallel requests during the refresh to avoid race conditions.
 * 4. Logs the user out if the refresh itself fails.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Skip interceptor logic for authentication endpoints
  if (AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint))) {
    return next(req);
  }

  // Attach Bearer token if available
  const token = authService.getToken();
  const authReq = token ? addTokenToRequest(req, token) : req;

  return next(authReq).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handleUnauthorized(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Clone the request with an Authorization header.
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

/**
 * Handle a 401 response by refreshing the token.
 * If a refresh is already in progress, queue this request until the new token arrives.
 */
function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(response => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        return next(addTokenToRequest(req, response.accessToken));
      }),
      catchError(err => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  }

  // A refresh is already in progress -- wait for the new token
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addTokenToRequest(req, token!)))
  );
}
