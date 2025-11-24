/**
 * Audit Service Contract
 *
 * Interface for managing audit trail of role changes.
 * Handles creation, retrieval, and automatic cleanup of audit entries.
 *
 * Feature: 002-user-role-management
 * Date: 2025-11-19
 */

import {Role} from '../data-model';

/**
 * Audit entry entity
 */
export interface AuditEntry {
  id: string;
  userId: string;
  action: 'role_change';
  oldRole: Role;
  newRole: Role;
  changedBy: string;
  timestamp: Date;
  ipAddress?: string;
}

/**
 * Audit Service Interface
 *
 * Manages role change audit trail with automatic retention policy.
 */
export interface IAuditService {
  /**
   * Log a role change event
   *
   * Creates an immutable audit entry recording the role change.
   *
   * @param entry - Audit entry data (id will be auto-generated)
   * @returns Created audit entry with generated ID
   */
  logRoleChange(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry>;

  /**
   * Get audit trail for a specific user
   *
   * Returns audit entries ordered by timestamp descending (newest first).
   *
   * @param userId - User ID
   * @param limit - Maximum number of entries (default: 50)
   * @returns Array of audit entries
   */
  getAuditTrail(userId: string, limit?: number): Promise<AuditEntry[]>;

  /**
   * Get all recent audit entries
   *
   * Returns recent audit entries across all users.
   *
   * @param limit - Maximum number of entries (default: 100)
   * @returns Array of audit entries ordered by timestamp descending
   */
  getRecentAuditEntries(limit?: number): Promise<AuditEntry[]>;

  /**
   * Cleanup audit entries older than retention period
   *
   * Deletes audit entries older than 1 month (30 days).
   * Should be called by scheduled job (daily cron).
   *
   * @returns Number of entries deleted
   */
  cleanupOldEntries(): Promise<number>;

  /**
   * Get audit entry by ID
   *
   * @param entryId - Audit entry ID
   * @returns Audit entry or null if not found
   */
  getEntry(entryId: string): Promise<AuditEntry | null>;
}
