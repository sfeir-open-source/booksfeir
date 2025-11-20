/**
 * User List Component
 *
 * Displays list of users with role assignment controls.
 * Excludes current admin from the list to prevent self-modification.
 *
 * Feature: 002-user-role-management (T024-T028)
 */

import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatChipsModule} from '@angular/material/chips';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {catchError, debounceTime, from, of, Subject, switchMap, tap} from 'rxjs';
import {User, UserRole} from '../../../../core/models/user.model';
import {UserRoleService} from '../../../../core/services/user-role.service';
import {AuthMockService} from '../../../../core/services/mock/auth-mock.service';
import {DatastoreService} from '../../../../core/services/datastore.service';
import {RoleSelector} from '../role-selector/role-selector';

@Component({
  selector: 'sfeir-user-list',
  imports: [
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    ScrollingModule,
    RoleSelector
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserList {
  private userRoleService = inject(UserRoleService);
  private authService = inject(AuthMockService);
  private snackBar = inject(MatSnackBar);
  private datastore = inject(DatastoreService);

  // Expose UserRole enum to template
  readonly UserRole = UserRole;

  // T064: Virtual scrolling configuration
  readonly ITEM_SIZE = 120; // Height of each user list item in pixels
  readonly VIRTUAL_SCROLL_THRESHOLD = 100; // Enable virtual scrolling for >100 users

  // T024: Signals for state management
  errorMessages = signal<Map<string, string>>(new Map());

  // T025: Current user ID as computed signal
  currentUserId = computed(() => this.authService.currentUser()?.id || '');

  // T024: Load users using RxJS observable converted to signal
  private users$ = this.userRoleService.getUsersExcept$(this.currentUserId()).pipe(
    catchError(error => {
      console.error('Failed to load users:', error);
      this.snackBar.open('Failed to load users', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return of([] as User[]);
    })
  );

  users = toSignal(this.users$, {initialValue: [] as User[]});
  loading = computed(() => this.users() === undefined);

  // T040: Load libraries using RxJS observable converted to signal
  private libraries$ = from(this.datastore.query<{ id: string; name: string }>('Library')).pipe(
    catchError(error => {
      console.error('Failed to load libraries:', error);
      return of([] as Array<{ id: string; name: string }>);
    })
  );

  libraries = toSignal(this.libraries$, {initialValue: [] as Array<{ id: string; name: string }>});

  // T025: Computed signal to filter out current admin
  filteredUsers = computed(() => {
    const current = this.currentUserId();
    return this.users().filter(u => u.id !== current);
  });

  // T064: Enable virtual scrolling for large lists
  useVirtualScroll = computed(() => this.filteredUsers().length > this.VIRTUAL_SCROLL_THRESHOLD);

  // Subjects for handling user actions
  private libraryAssignmentAction$ = new Subject<{ user: User; libraryIds: string[] }>();
  private roleChangeAction$ = new Subject<{ user: User; newRole: UserRole }>();

  // Convert library assignment actions to observable
  private libraryAssignmentResult$ = this.libraryAssignmentAction$.pipe(
    switchMap(({user, libraryIds}) =>
      this.userRoleService.assignLibraries$(user.id, libraryIds).pipe(
        tap(() => {
          this.snackBar.open(
            `Libraries assigned to ${user.name}`,
            'Close',
            {duration: 3000}
          );
        }),
        catchError(error => {
          const errorMsg = error instanceof Error ? error.message : 'Failed to assign libraries';
          this.snackBar.open(errorMsg, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          return of(undefined);
        })
      )
    )
  );

  // Convert role change actions to observable with side effects (T065: debounce to prevent rapid-fire changes)
  private roleChangeResult$ = this.roleChangeAction$.pipe(
    debounceTime(300), // T065: Wait 300ms after last change before processing
    tap(({user}) => {
      // Clear previous error for this user
      this.errorMessages.update(map => {
        const newMap = new Map(map);
        newMap.delete(user.id);
        return newMap;
      });
    }),
    switchMap(({user, newRole}) => {
      const currentId = this.currentUserId();
      return this.userRoleService.assignRole$(currentId, user.id, newRole).pipe(
        tap(result => {
          if (result.success) {
            this.snackBar.open(
              `Role changed to ${newRole} for ${user.name}`,
              'Close',
              {duration: 3000}
            );
          } else {
            this.errorMessages.update(map => {
              const newMap = new Map(map);
              newMap.set(user.id, result.error || 'Failed to change role');
              return newMap;
            });

            this.snackBar.open(result.error || 'Failed to change role', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }),
        catchError(error => {
          console.error('Error changing role:', error);
          this.snackBar.open('An unexpected error occurred', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          return of(undefined);
        })
      );
    })
  );

  // Subscribe to observables using toSignal (no manual subscribe needed)
  private libraryAssignmentStatus = toSignal(this.libraryAssignmentResult$);
  private roleChangeStatus = toSignal(this.roleChangeResult$);

  /**
   * Handle library assignment change for a librarian (T041)
   */
  onLibrariesChange(user: User, libraryIds: string[]): void {
    this.libraryAssignmentAction$.next({user, libraryIds});
  }

  /**
   * Handle role change for a user (T027)
   */
  onRoleChange(user: User, newRole: UserRole): void {
    this.roleChangeAction$.next({user, newRole});
  }

  /**
   * Get error message for a specific user
   */
  getErrorMessage(userId: string): string | undefined {
    return this.errorMessages().get(userId);
  }

  /**
   * Get user initials for avatar placeholder
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
