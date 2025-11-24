/**
 * User Management Routes
 *
 * Lazy-loaded routes for user role management feature.
 * Protected by AdminRoleGuard to ensure only admins can access.
 *
 * Feature: 002-user-role-management (T032)
 */

import {Routes} from '@angular/router';
import {adminRoleGuard} from '../../core/guards/admin-role.guard';

export const userManagementRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-management/user-management').then(m => m.UserManagement),
    canActivate: [adminRoleGuard]
  }
];
