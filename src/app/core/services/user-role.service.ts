/**
 * User Role Service
 *
 * Business logic service for user role management operations.
 * Handles role assignments, validations, and audit logging.
 * Uses RxJS Observables for reactive data streams.
 *
 * Feature: 002-user-role-management (T017, T018)
 */

import {Injectable, signal} from '@angular/core';
import {catchError, from, map, Observable, of, switchMap, tap} from 'rxjs';
import {DatastoreService} from './datastore.service';
import {User, UserRole} from '../models/user.model';
import {AuditService} from './audit.service';

/**
 * Result of role assignment operation
 */
export interface RoleAssignmentResult {
  success: boolean;
  error?: string;
  userId: string;
  newRole: UserRole;
  previousRole: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  // Signal for tracking users (reactive state)
  private usersSignal = signal<User[]>([]);

  // Public readonly users signal
  readonly users = this.usersSignal.asReadonly();

  constructor(
    private datastore: DatastoreService,
    private auditService: AuditService
  ) {
  }

  /**
   * Assign a role to a user (T017, T018)
   *
   * Validates:
   * - Current user is admin
   * - Target user exists
   * - Not self-modification
   *
   * @param currentUserId - ID of admin making the change
   * @param targetUserId - ID of user to modify
   * @param newRole - Role to assign
   * @returns Observable of assignment result
   */
  assignRole$(
    currentUserId: string,
    targetUserId: string,
    newRole: UserRole
  ): Observable<RoleAssignmentResult> {
    return this.isAdmin$(currentUserId).pipe(
      switchMap(isCurrentUserAdmin => {
        if (!isCurrentUserAdmin) {
          return of({
            success: false,
            error: 'Only administrators can assign roles',
            userId: targetUserId,
            newRole,
            previousRole: UserRole.USER
          });
        }

        if (currentUserId === targetUserId) {
          return of({
            success: false,
            error: 'You cannot modify your own role',
            userId: targetUserId,
            newRole,
            previousRole: UserRole.USER
          });
        }

        return this.getUser$(targetUserId).pipe(
          switchMap(targetUser => {
            if (!targetUser) {
              return of({
                success: false,
                error: 'User not found',
                userId: targetUserId,
                newRole,
                previousRole: UserRole.USER
              });
            }

            const previousRole = targetUser.role;

            if (previousRole === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
              return this.countAdmins$().pipe(
                switchMap(adminCount => {
                  if (adminCount <= 1) {
                    return of({
                      success: false,
                      error: 'Cannot demote the last administrator',
                      userId: targetUserId,
                      newRole,
                      previousRole
                    });
                  }

                  return this.updateUserRole(
                    currentUserId,
                    targetUserId,
                    targetUser,
                    newRole,
                    previousRole
                  );
                })
              );
            }

            return this.updateUserRole(
              currentUserId,
              targetUserId,
              targetUser,
              newRole,
              previousRole
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error assigning role:', error);
        return of({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to assign role',
          userId: targetUserId,
          newRole,
          previousRole: UserRole.USER
        });
      })
    );
  }

  private updateUserRole(
    currentUserId: string,
    targetUserId: string,
    targetUser: User,
    newRole: UserRole,
    previousRole: UserRole
  ): Observable<RoleAssignmentResult> {
    const updatedUser: User = {
      ...targetUser,
      role: newRole,
      updatedAt: new Date(),
      updatedBy: currentUserId,
      libraryIds: newRole === UserRole.LIBRARIAN ? targetUser.libraryIds : undefined
    };

    return from(this.datastore.save('User', updatedUser)).pipe(
      switchMap(() =>
        this.auditService.logRoleChange$(
          targetUserId,
          previousRole,
          newRole,
          currentUserId
        )
      ),
      tap(() => {
        this.usersSignal.update(users =>
          users.map(u => u.id === targetUserId ? updatedUser : u)
        );
      }),
      map(() => ({
        success: true,
        userId: targetUserId,
        newRole,
        previousRole
      }))
    );
  }

  /**
   * Get all users except the specified user (T017)
   * @param excludeUserId - User ID to exclude (current admin)
   * @returns Observable of users array
   */
  getUsersExcept$(excludeUserId: string): Observable<User[]> {
    return from(this.datastore.query<User>('User')).pipe(
      map(allUsers => allUsers.filter(u => u.id !== excludeUserId)),
      tap(filteredUsers => this.usersSignal.set(filteredUsers))
    );
  }

  /**
   * Get user by ID (T017)
   * @param userId - User ID
   * @returns Observable of user or null if not found
   */
  getUser$(userId: string): Observable<User | null> {
    return from(this.datastore.get<User>('User', userId));
  }

  /**
   * Check if user has admin role (T017)
   * @param userId - User ID to check
   * @returns Observable of boolean indicating if user is admin
   */
  isAdmin$(userId: string): Observable<boolean> {
    return this.getUser$(userId).pipe(
      map(user => user?.role === UserRole.ADMIN)
    );
  }

  /**
   * Count number of admin users in the system (T046 - Phase 5)
   * @returns Observable of number of users with ADMIN role
   */
  countAdmins$(): Observable<number> {
    return from(this.datastore.query<User>('User')).pipe(
      map(allUsers => allUsers.filter(u => u.role === UserRole.ADMIN).length)
    );
  }

  /**
   * Assign libraries to a librarian (T037, T038 - Phase 4)
   * @param userId - Librarian user ID
   * @param libraryIds - Array of library IDs to assign
   * @returns Observable of void
   */
  assignLibraries$(userId: string, libraryIds: string[]): Observable<void> {
    return this.getUser$(userId).pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('User not found');
        }

        if (user.role !== UserRole.LIBRARIAN) {
          throw new Error('Can only assign libraries to librarians');
        }

        if (libraryIds.length > 0) {
          return from(this.datastore.query('Library')).pipe(
            map(libraries => {
              const existingLibraryIds = new Set(libraries.map((lib: any) => lib.id));
              const invalidLibraries = libraryIds.filter(id => !existingLibraryIds.has(id));

              if (invalidLibraries.length > 0) {
                throw new Error(`Invalid library IDs: ${invalidLibraries.join(', ')}`);
              }

              return user;
            })
          );
        }

        return of(user);
      }),
      switchMap(user => {
        const updatedUser: User = {
          ...user,
          libraryIds,
          updatedAt: new Date()
        };

        return from(this.datastore.save('User', updatedUser)).pipe(
          tap(() => {
            this.usersSignal.update(users =>
              users.map(u => u.id === userId ? updatedUser : u)
            );
          }),
          map(() => undefined)
        );
      })
    );
  }

  /**
   * Get libraries assigned to a librarian (T037 - Phase 4)
   * @param userId - Librarian user ID
   * @returns Observable of array of library IDs
   */
  getAssignedLibraries$(userId: string): Observable<string[]> {
    return this.getUser$(userId).pipe(
      map(user => user?.libraryIds || [])
    );
  }
}
