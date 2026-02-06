import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Functional route guard that checks whether the user is authenticated.
 * Redirects unauthenticated users to the login page.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login with a return URL for post-login navigation
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: location.pathname }
  });
};
