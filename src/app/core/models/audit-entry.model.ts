/**
 * Audit Entry Model
 *
 * Represents an audit log entry for role change events.
 * Provides an immutable trail of all role modifications.
 *
 * Retention: Entries are automatically deleted after 30 days.
 *
 * Feature: 002-user-role-management
 */

import {UserRole} from './user.model';

export interface AuditEntry {
  id: string;                    // Unique identifier
  userId: string;                // User whose role was changed
  action: 'role_change';         // Action type (fixed to role_change)
  oldRole: UserRole;             // Previous role
  newRole: UserRole;             // New role assigned
  changedBy: string;             // Admin user ID who made the change
  timestamp: Date;               // When the change occurred
  ipAddress?: string;            // Optional: IP address of admin making change
}
