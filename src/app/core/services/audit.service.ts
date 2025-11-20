/**
 * Audit Service
 *
 * Manages audit trail for role changes and other security-sensitive actions.
 * Automatically cleans up entries older than 30 days.
 * Uses RxJS Observables for reactive data streams.
 *
 * Feature: 002-user-role-management (T053, T054, T055 - Phase 6)
 */

import {Injectable} from '@angular/core';
import {from, map, Observable, switchMap} from 'rxjs';
import {DatastoreService} from './datastore.service';
import {AuditEntry} from '../models/audit-entry.model';
import {UserRole} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly AUDIT_RETENTION_DAYS = 30;

  constructor(private datastore: DatastoreService) {
  }

  /**
   * Log a role change event (T053, T054)
   * @param userId - User whose role changed
   * @param oldRole - Previous role
   * @param newRole - New role
   * @param changedBy - Admin who made the change
   * @returns Observable of created audit entry
   */
  logRoleChange$(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
    changedBy: string
  ): Observable<AuditEntry> {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action: 'role_change',
      oldRole,
      newRole,
      changedBy,
      timestamp: new Date()
    };

    return from(this.datastore.save('AuditEntry', auditEntry)).pipe(
      map(() => auditEntry)
    );
  }

  /**
   * Get audit trail for a specific user (T053)
   * @param userId - User ID to get audit trail for
   * @returns Observable of audit entries array, sorted by timestamp descending
   */
  getAuditTrail$(userId: string): Observable<AuditEntry[]> {
    return from(this.datastore.query<AuditEntry>('AuditEntry')).pipe(
      map(allEntries =>
        allEntries
          .filter(entry => entry.userId === userId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      )
    );
  }

  /**
   * Get all audit entries (admin view) (T053)
   * @param limit - Maximum number of entries to return
   * @returns Observable of audit entries array, sorted by timestamp descending
   */
  getAllAuditEntries$(limit: number = 100): Observable<AuditEntry[]> {
    return from(this.datastore.query<AuditEntry>('AuditEntry')).pipe(
      map(allEntries =>
        allEntries
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit)
      )
    );
  }

  /**
   * Clean up audit entries older than retention period (T055)
   * Should be called via scheduled job (Cloud Scheduler, cron, etc.)
   * @returns Observable of number of entries deleted
   */
  cleanupOldEntries$(): Observable<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.AUDIT_RETENTION_DAYS);

    return from(this.datastore.query<AuditEntry>('AuditEntry')).pipe(
      switchMap(allEntries => {
        const oldEntries = allEntries.filter(
          entry => entry.timestamp < cutoffDate
        );

        if (oldEntries.length > 0) {
          const idsToDelete = oldEntries.map(entry => entry.id);
          return from(this.datastore.batchDelete('AuditEntry', idsToDelete)).pipe(
            map(() => oldEntries.length)
          );
        }

        return from([0]);
      })
    );
  }
}
