import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User, UserRole } from '../../models/user.model';

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
    avatar: '/assets/default-avatar.png',
    role: UserRole.USER,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  };

  // Signal for current user (reactive state)
  private currentUserSignal = signal<User | null>(this.MOCK_USER);

  // Public readonly current user
  currentUser = this.currentUserSignal.asReadonly();

  // Computed: Is user authenticated?
  isAuthenticated = computed(() => this.currentUser() !== null);

  // Computed: Is user an admin?
  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

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
    this.currentUserSignal.set(this.MOCK_USER);
    return of(this.MOCK_USER);
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
    const adminUser: User = {
      ...this.MOCK_USER,
      role: UserRole.ADMIN,
      name: 'Admin User',
      email: 'admin@booksfeir.com'
    };
    this.currentUserSignal.set(adminUser);
  }

  /**
   * Switch to regular user (for testing user features)
   */
  switchToUser(): void {
    this.currentUserSignal.set(this.MOCK_USER);
  }
}
