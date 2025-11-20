/**
 * User Management Container Component
 *
 * Container component for user role management feature.
 * Displays user list with role assignment controls.
 *
 * Feature: 002-user-role-management (T031)
 */

import {ChangeDetectionStrategy, Component} from '@angular/core';
import {UserList} from '../components/user-list/user-list';
import {AuditLog} from '../components/audit-log/audit-log';

@Component({
  selector: 'sfeir-user-management',
  imports: [UserList, AuditLog],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagement {
}
