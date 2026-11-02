import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protects screens that need a signed-in user.
 *
 * The application initializer has already resolved `GET /api/auth/me` before
 * the first navigation, so this check is synchronous. If that ever stops being
 * true, the guard starts sending signed-in users to the login page during the
 * brief `unknown` window — a behavior worth re-checking then.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

/** Keeps a signed-in user off the login screen. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true;
};
