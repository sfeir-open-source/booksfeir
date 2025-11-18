/**
 * User Model
 *
 * Represents an application user with authentication and authorization context.
 *
 * Business Rules:
 * - name and email are required
 * - avatar is optional
 * - role determines permissions (USER or ADMIN)
 */

export interface User {
  id: string;                    // Unique identifier
  name: string;                  // Required: User's display name
  email: string;                 // Required: User's email address
  avatar?: string;               // Optional: URL or data URI for user avatar
  role: UserRole;                // User's role (permissions)
  createdAt: Date;               // Account creation timestamp
  updatedAt: Date;               // Last profile update timestamp
}

/**
 * User role for authorization
 */
export enum UserRole {
  USER = 'USER',                 // Standard user (can borrow, manage own content)
  ADMIN = 'ADMIN'                // Administrator (can approve purchase requests, manage all content)
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
    user['updatedAt'] instanceof Date
  );
}
