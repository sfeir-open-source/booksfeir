/**
 * User Model
 *
 * Represents an application user with authentication and authorization context.
 *
 * Business Rules:
 * - name and email are required
 * - avatar is optional
 * - role determines permissions (USER, LIBRARIAN, or ADMIN)
 * - libraryIds only applies to LIBRARIAN role
 * - updatedBy tracks who made the last change
 *
 * Feature: Enhanced by 002-user-role-management
 */

export interface User {
  id: string;                    // Unique identifier
  name: string;                  // Required: User's display name
  email: string;                 // Required: User's email address
  avatar?: string;               // Optional: URL or data URI for user avatar
  role: UserRole;                // User's role (permissions)
  createdAt: Date;               // Account creation timestamp
  updatedAt: Date;               // Last profile update timestamp
  updatedBy: string;             // User ID who made the last update
  libraryIds?: string[];         // Library IDs assigned to librarians
}

/**
 * User role for authorization
 */
export enum UserRole {
  USER = 'USER',                 // Standard user (can borrow, manage own content)
  LIBRARIAN = 'LIBRARIAN',       // Librarian (can manage assigned libraries)
  ADMIN = 'ADMIN'                // Administrator (can approve purchase requests, manage all content, assign roles)
}

/**
 * Type guard to check if an object is a valid User
 */
export function isUser(obj: unknown): obj is User {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const user = obj as Record<string, unknown>;
  return (
    typeof user['id'] === 'string' &&
    typeof user['name'] === 'string' &&
    typeof user['email'] === 'string' &&
    (user['avatar'] === undefined || typeof user['avatar'] === 'string') &&
    Object.values(UserRole).includes(user['role'] as UserRole) &&
    user['createdAt'] instanceof Date &&
    user['updatedAt'] instanceof Date &&
    typeof user['updatedBy'] === 'string' &&
    (user['libraryIds'] === undefined || Array.isArray(user['libraryIds']))
  );
}
