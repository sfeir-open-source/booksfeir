/**
 * RolePermissionService Unit Tests
 *
 * Tests for role-based feature access control.
 *
 * Feature: 002-user-role-management (T074)
 */

import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {Feature, RolePermissionService} from './role-permission.service';
import {UserRole} from '../models/user.model';

describe('RolePermissionService', () => {
  let service: RolePermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(), RolePermissionService]
    });
    service = TestBed.inject(RolePermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('canAccessFeature', () => {
    describe('ADMIN role', () => {
      it('should have access to all features', () => {
        const allFeatures: Feature[] = [
          'library_management',
          'user_management',
          'basic_features',
          'borrow_books',
          'return_books',
          'view_libraries'
        ];

        allFeatures.forEach(feature => {
          expect(service.canAccessFeature(UserRole.ADMIN, feature)).toBe(true);
        });
      });
    });

    describe('LIBRARIAN role', () => {
      it('should have access to library management', () => {
        expect(service.canAccessFeature(UserRole.LIBRARIAN, 'library_management')).toBe(true);
      });

      it('should have access to basic features', () => {
        expect(service.canAccessFeature(UserRole.LIBRARIAN, 'basic_features')).toBe(true);
      });

      it('should have access to borrow books', () => {
        expect(service.canAccessFeature(UserRole.LIBRARIAN, 'borrow_books')).toBe(true);
      });

      it('should have access to return books', () => {
        expect(service.canAccessFeature(UserRole.LIBRARIAN, 'return_books')).toBe(true);
      });

      it('should have access to view libraries', () => {
        expect(service.canAccessFeature(UserRole.LIBRARIAN, 'view_libraries')).toBe(true);
      });

      it('should NOT have access to user management', () => {
        expect(service.canAccessFeature(UserRole.LIBRARIAN, 'user_management')).toBe(false);
      });
    });

    describe('USER role', () => {
      it('should have access to basic features', () => {
        expect(service.canAccessFeature(UserRole.USER, 'basic_features')).toBe(true);
      });

      it('should have access to borrow books', () => {
        expect(service.canAccessFeature(UserRole.USER, 'borrow_books')).toBe(true);
      });

      it('should have access to view libraries', () => {
        expect(service.canAccessFeature(UserRole.USER, 'view_libraries')).toBe(true);
      });

      it('should NOT have access to library management', () => {
        expect(service.canAccessFeature(UserRole.USER, 'library_management')).toBe(false);
      });

      it('should NOT have access to user management', () => {
        expect(service.canAccessFeature(UserRole.USER, 'user_management')).toBe(false);
      });

      it('should NOT have access to return books', () => {
        expect(service.canAccessFeature(UserRole.USER, 'return_books')).toBe(false);
      });
    });
  });

  describe('canManageUsers', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManageUsers(UserRole.ADMIN)).toBe(true);
    });

    it('should return false for LIBRARIAN', () => {
      expect(service.canManageUsers(UserRole.LIBRARIAN)).toBe(false);
    });

    it('should return false for USER', () => {
      expect(service.canManageUsers(UserRole.USER)).toBe(false);
    });
  });

  describe('canManageLibraries', () => {
    it('should return true for ADMIN', () => {
      expect(service.canManageLibraries(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for LIBRARIAN', () => {
      expect(service.canManageLibraries(UserRole.LIBRARIAN)).toBe(true);
    });

    it('should return false for USER', () => {
      expect(service.canManageLibraries(UserRole.USER)).toBe(false);
    });
  });

  describe('canBorrowBooks', () => {
    it('should return true for ADMIN', () => {
      expect(service.canBorrowBooks(UserRole.ADMIN)).toBe(true);
    });

    it('should return true for LIBRARIAN', () => {
      expect(service.canBorrowBooks(UserRole.LIBRARIAN)).toBe(true);
    });

    it('should return true for USER', () => {
      expect(service.canBorrowBooks(UserRole.USER)).toBe(true);
    });
  });

  describe('getAccessibleFeatures', () => {
    it('should return all features for ADMIN', () => {
      const features = service.getAccessibleFeatures(UserRole.ADMIN);
      expect(features.length).toBe(6);
      expect(features).toContain('library_management');
      expect(features).toContain('user_management');
      expect(features).toContain('basic_features');
      expect(features).toContain('borrow_books');
      expect(features).toContain('return_books');
      expect(features).toContain('view_libraries');
    });

    it('should return librarian-specific features for LIBRARIAN', () => {
      const features = service.getAccessibleFeatures(UserRole.LIBRARIAN);
      expect(features.length).toBe(5);
      expect(features).toContain('library_management');
      expect(features).toContain('basic_features');
      expect(features).toContain('borrow_books');
      expect(features).toContain('return_books');
      expect(features).toContain('view_libraries');
      expect(features).not.toContain('user_management');
    });

    it('should return user-specific features for USER', () => {
      const features = service.getAccessibleFeatures(UserRole.USER);
      expect(features.length).toBe(3);
      expect(features).toContain('basic_features');
      expect(features).toContain('borrow_books');
      expect(features).toContain('view_libraries');
      expect(features).not.toContain('library_management');
      expect(features).not.toContain('user_management');
      expect(features).not.toContain('return_books');
    });
  });
});
