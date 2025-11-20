/**
 * Admin Role Guard
 *
 * Route guard that restricts access to admin-only routes.
 * Uses inject() pattern for dependency injection (zoneless compatible).
 *
 * Feature: 002-user-role-management
 */

import {inject} from '@angular/core';
import {Router, CanActivateFn} from '@angular/router';
import {AuthMockService} from '../services/mock/auth-mock.service';

/**
 * Guard function to protect admin-only routes
 *
 * @returns true if user is admin, false otherwise (redirects to home)
 */
export const adminRoleGuard: CanActivateFn = () => {
  const authService = inject(AuthMockService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // Redirect non-admin users to home page
  return router.createUrlTree(['/']);
};
