import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Functional route guard that restricts access to admin-only routes.
 * Checks for both authentication and admin role before allowing access.
 */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  if (!authService.isAuthenticated()) {
    // Not authenticated at all, redirect to login
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: location.pathname }
    });
  }

  // Authenticated but not an admin, redirect to home
  return router.createUrlTree(['/home']);
};
