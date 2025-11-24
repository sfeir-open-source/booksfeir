/**
 * Role Permission Service
 *
 * Manages feature-level permissions based on user roles.
 * Provides centralized authorization logic for different features.
 *
 * Feature: 002-user-role-management (T016a, T016b, T016c)
 */

import {Injectable} from '@angular/core';
import {UserRole} from '../models/user.model';

/**
 * Feature identifiers for permission checks
 */
export type Feature =
  | 'library_management'
  | 'user_management'
  | 'basic_features'
  | 'borrow_books'
  | 'return_books'
  | 'view_libraries';

@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {
  /**
   * Check if a user with given role can access a feature
   *
   * @param role - User's role
   * @param feature - Feature to check access for
   * @returns true if user can access the feature
   */
  canAccessFeature(role: UserRole, feature: Feature): boolean {
    // T016b: Permission checks for each role
    switch (role) {
      case UserRole.ADMIN:
        // Admin can access all features
        return true;

      case UserRole.LIBRARIAN:
        // Librarian can access library management and basic features
        return [
          'library_management',
          'basic_features',
          'borrow_books',
          'return_books',
          'view_libraries'
        ].includes(feature);

      case UserRole.USER:
        // User can only access basic features
        return [
          'basic_features',
          'borrow_books',
          'view_libraries'
        ].includes(feature);

      default:
        // Unknown roles have no permissions
        return false;
    }
  }

  /**
   * Check if a user can manage other users
   *
   * @param role - User's role
   * @returns true if user can manage other users (admin only)
   */
  canManageUsers(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  /**
   * Check if a user can manage libraries
   *
   * @param role - User's role
   * @returns true if user can manage libraries (admin or librarian)
   */
  canManageLibraries(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.LIBRARIAN;
  }

  /**
   * Check if a user can borrow books
   *
   * @param role - User's role
   * @returns true if user can borrow books (all roles)
   */
  canBorrowBooks(role: UserRole): boolean {
    return [UserRole.USER, UserRole.LIBRARIAN, UserRole.ADMIN].includes(role);
  }

  /**
   * Get all features accessible by a role
   *
   * @param role - User's role
   * @returns Array of accessible features
   */
  getAccessibleFeatures(role: UserRole): Feature[] {
    const allFeatures: Feature[] = [
      'library_management',
      'user_management',
      'basic_features',
      'borrow_books',
      'return_books',
      'view_libraries'
    ];

    return allFeatures.filter(feature => this.canAccessFeature(role, feature));
  }
}
