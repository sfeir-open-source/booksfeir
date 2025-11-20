import {computed, Injectable, signal} from '@angular/core';
import {Observable, of} from 'rxjs';
import {User, UserRole} from '../../models/user.model';

/**
 * AuthMockService
 *
 * Mock authentication service for local development.
 * Provides a hard-coded current user with signal-based reactivity.
 *
 * In production, this would be replaced with actual GCP Identity Federation.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
  // Hard-coded mock user for development
  private readonly MOCK_USER: User = {
    id: 'mock-user-1',
    name: 'Demo User',
    email: 'demo@booksfeir.com',
    role: UserRole.USER,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    updatedBy: 'system'
  };
  private readonly MOCK_ADMIN: User = {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@booksfeir.com',
    role: UserRole.ADMIN,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    updatedBy: 'system'
  };

  private readonly MOCK_LIBRARIAN: User = {
    id: 'lib1',
    name: 'Library Manager',
    email: 'librarian@booksfeir.com',
    role: UserRole.LIBRARIAN,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    updatedBy: 'system'
  };

  private readonly MOCK_CURRENT_USER = this.MOCK_LIBRARIAN

  // Signal for current user (reactive state)
  private currentUserSignal = signal<User | null>(this.MOCK_CURRENT_USER);

  // Public readonly current user
  currentUser = this.currentUserSignal.asReadonly();

  // Computed: Is user authenticated?
  isAuthenticated = computed(() => this.currentUser() !== null);

  // Computed: Is user an admin?
  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  rigthOfManage = computed(() => this.isAuthenticated() && this.currentUser()?.role !== UserRole.USER);
  /**
   * Get current user as Observable (for compatibility with services expecting Observables)
   */
  getCurrentUser(): Observable<User | null> {
    return of(this.currentUser());
  }

  /**
   * Check if user is authenticated
   */
  checkAuth(): Observable<boolean> {
    return of(this.isAuthenticated());
  }

  /**
   * Mock login (for testing)
   */
  login(email: string): Observable<User> {
    // In mock mode, always return the mock user regardless of email
    this.currentUserSignal.set(this.MOCK_CURRENT_USER);
    return of(this.MOCK_CURRENT_USER);
  }

  /**
   * Mock logout (for testing)
   */
  logout(): Observable<void> {
    this.currentUserSignal.set(null);
    return of(void 0);
  }

  /**
   * Get user ID (convenience method)
   */
  getUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  /**
   * Get user name (convenience method)
   */
  getUserName(): string | null {
    return this.currentUser()?.name ?? null;
  }

  /**
   * Switch to admin user (for testing admin features)
   */
  switchToAdmin(): void {
    this.currentUserSignal.set(this.MOCK_ADMIN);
  }

  /**
   * Switch to regular user (for testing user features)
   */
  switchToUser(): void {
    this.currentUserSignal.set(this.MOCK_USER);
  }
}
