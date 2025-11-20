/**
 * Role Assignment Model
 *
 * Represents a role assignment event in the system.
 * Tracks who assigned a role to whom and when.
 *
 * Feature: 002-user-role-management
 */

import {UserRole} from './user.model';

export interface RoleAssignment {
  id: string;                    // Unique identifier
  userId: string;                // User who received the role
  role: UserRole;                // Role that was assigned
  assignedBy: string;            // Admin user ID who made the assignment
  assignedAt: Date;              // Timestamp of assignment
  previousRole?: UserRole;       // Previous role (for tracking changes)
}
