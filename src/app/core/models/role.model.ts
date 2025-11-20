/**
 * Role Enumeration
 *
 * Defines the three user roles in the system:
 * - USER: Basic user with read-only access
 * - LIBRARIAN: Library manager with library-specific permissions
 * - ADMIN: System administrator with full access
 *
 * Feature: 002-user-role-management
 */
export enum Role {
  USER = 'user',
  LIBRARIAN = 'librarian',
  ADMIN = 'admin'
}