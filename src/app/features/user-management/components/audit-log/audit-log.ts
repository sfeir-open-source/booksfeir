/**
 * Audit Log Component
 *
 * Displays audit trail of role changes for a user.
 * Shows timestamp, who made the change, and old/new roles.
 *
 * Feature: 002-user-role-management (T057, T058 - Phase 6)
 */

import {Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatListModule} from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';
import {catchError, of, switchMap} from 'rxjs';
import {AuditService} from '../../../../core/services/audit.service';
import {AuditEntry} from '../../../../core/models/audit-entry.model';

/**
 * Formatted audit entry for display
 */
interface FormattedAuditEntry {
  id: string;
  timestamp: string;
  changedBy: string;
  oldRole: string;
  newRole: string;
  description: string;
}

@Component({
  selector: 'sfeir-audit-log',
  imports: [MatListModule, MatProgressSpinnerModule, MatDividerModule],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss'
})
export class AuditLog {
  private auditService = inject(AuditService);

  // T057: Input for user ID to show audit trail for
  userId = input<string>();

  // T058: Load audit trail reactively based on userId input
  // Convert userId signal to observable and switch to appropriate audit trail query
  private auditEntries$ = toObservable(this.userId).pipe(
    switchMap(userId =>
      userId
        ? this.auditService.getAuditTrail$(userId)
        : this.auditService.getAllAuditEntries$(50)
    ),
    catchError(error => {
      console.error('Failed to load audit trail:', error);
      return of([] as AuditEntry[]);
    })
  );

  // Use undefined as initial value to properly track loading state
  auditEntries = toSignal(this.auditEntries$, {initialValue: undefined});
  loading = computed(() => this.auditEntries() === undefined);

  // T058: Computed signal for formatted audit entries
  formattedEntries = computed<FormattedAuditEntry[]>(() => {
    const entries = this.auditEntries();
    if (!entries) return [];
    return entries.map(entry => ({
      id: entry.id,
      timestamp: new Date(entry.timestamp).toLocaleString(),
      changedBy: entry.changedBy,
      oldRole: this.formatRole(entry.oldRole),
      newRole: this.formatRole(entry.newRole),
      description: `Role changed from ${this.formatRole(entry.oldRole)} to ${this.formatRole(entry.newRole)}`
    }));
  });

  /**
   * Format role enum value for display
   */
  private formatRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
}
