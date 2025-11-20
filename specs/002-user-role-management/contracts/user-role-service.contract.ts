/**
 * User Role Service Contract
 *
 * Business logic interface for user role management operations.
 * This service orchestrates role assignments, validations, and audit logging.
 *
 * Feature: 002-user-role-management
 * Date: 2025-11-19
 */

import {Role} from '../data-model';

/**
 * Result of role assignment operation
 */
export interface RoleAssignmentResult {
  /** Whether the assignment succeeded */
  success: boolean;
  /** Error message if assignment failed */
  error?: string;
  /** User ID that was modified */
  userId: string;
  /** New role assigned */
  newRole: Role;
  /** Previous role */
  previousRole: Role;
}

/**
 * User Role Service Interface
 *
 * Provides business logic for role assignment operations with
 * validation, authorization, and audit logging.
 */
export interface IUserRoleService {
  /**
   * Assign a role to a user
   *
   * Validates:
   * - Current user is admin
   * - Target user exists
   * - Not self-modification
   * - Not demoting last admin
   *
   * Creates:
   * - RoleAssignment record
   * - AuditEntry record
   * - Updates User.role
   *
   * @param currentUserId - ID of admin making the change
   * @param targetUserId - ID of user to modify
   * @param newRole - Role to assign
   * @returns Result of assignment operation
   */
  assignRole(
    currentUserId: string,
    targetUserId: string,
    newRole: Role
  ): Promise<RoleAssignmentResult>;

  /**
   * Get all users except the specified user
   *
   * Used by admin UI to show editable users.
   *
   * @param excludeUserId - User ID to exclude (current admin)
   * @returns Array of users
   */
  getUsersExcept(excludeUserId: string): Promise<User[]>;

  /**
   * Get user by ID
   *
   * @param userId - User ID
   * @returns User or null if not found
   */
  getUser(userId: string): Promise<User | null>;

  /**
   * Check if user has admin role
   *
   * @param userId - User ID to check
   * @returns True if user is admin
   */
  isAdmin(userId: string): Promise<boolean>;

  /**
   * Assign libraries to a librarian
   *
   * Validates:
   * - User has librarian role
   * - All library IDs exist
   *
   * @param userId - Librarian user ID
   * @param libraryIds - Array of library IDs to assign
   */
  assignLibraries(userId: string, libraryIds: string[]): Promise<void>;

  /**
   * Get libraries assigned to a librarian
   *
   * @param userId - Librarian user ID
   * @returns Array of library IDs
   */
  getAssignedLibraries(userId: string): Promise<string[]>;
}

/**
 * User entity interface (from data model)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  libraryIds?: string[];
}
