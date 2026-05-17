import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

/**
 * Allows access only to authenticated users with ADMIN_ROLE.
 * - Not signed in → redirects to /sign-in
 * - Signed in but not admin → redirects to /user/home
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (!authService.isSignedIn()) {
    router.navigate(['/sign-in']);
    return false;
  }

  if (!authService.isAdmin()) {
    router.navigate(['/user/home']);
    return false;
  }

  return true;
};
