/**
 * Role Selector Component
 *
 * Reusable dropdown component for selecting user roles.
 * Supports USER, LIBRARIAN, and ADMIN roles.
 *
 * Feature: 002-user-role-management (T020, T021)
 */

import {Component, input, output} from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {UserRole} from '../../../../core/models/user.model';

@Component({
  selector: 'sfeir-role-selector',
  imports: [MatSelectModule, MatFormFieldModule],
  templateUrl: './role-selector.html',
  styleUrl: './role-selector.scss',
  host: {
    '[class.role-selector]': 'true',
    '[class.disabled]': 'disabled()'
  }
})
export class RoleSelector {
  // T020: Input signals
  currentRole = input.required<UserRole>();
  disabled = input<boolean>(false);

  // T020: Output event
  roleChange = output<UserRole>();

  // Available roles for selection
  readonly availableRoles = [
    {value: UserRole.USER, label: 'User'},
    {value: UserRole.LIBRARIAN, label: 'Librarian'},
    {value: UserRole.ADMIN, label: 'Admin'}
  ];

  /**
   * Handle role selection change
   */
  onRoleChange(newRole: UserRole): void {
    if (!this.disabled()) {
      this.roleChange.emit(newRole);
    }
  }
}
