/**
 * UserRoleService Unit Tests
 *
 * Tests for user role management including:
 * - Role assignment with validation
 * - Self-modification prevention
 * - Last admin protection
 * - Library assignment for librarians
 *
 * Feature: 002-user-role-management (T074)
 */

import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {UserRoleService} from './user-role.service';
import {DatastoreService} from './datastore.service';
import {AuditService} from './audit.service';
import {User, UserRole} from '../models/user.model';
import {vi} from 'vitest';
import {of} from 'rxjs';

describe('UserRoleService', () => {
  let service: UserRoleService;
  let datastoreService: any;
  let auditService: any;
  let mockUsers: User[];
  let mockAdmin: User;
  let mockUser: User;
  let mockLibrarian: User;

  beforeEach(() => {
    const datastoreSpy = {
      get: vi.fn(),
      query: vi.fn(),
      save: vi.fn()
    };
    const auditSpy = {
      logRoleChange$: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        UserRoleService,
        {provide: DatastoreService, useValue: datastoreSpy},
        {provide: AuditService, useValue: auditSpy}
      ]
    });

    service = TestBed.inject(UserRoleService);
    datastoreService = TestBed.inject(DatastoreService) as any;
    auditService = TestBed.inject(AuditService) as any;

    // Setup mock users
    mockAdmin = {
      id: 'admin1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'system'
    };

    mockUser = {
      id: 'user1',
      email: 'user@test.com',
      name: 'Regular User',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'admin1'
    };

    mockLibrarian = {
      id: 'lib1',
      email: 'librarian@test.com',
      name: 'Librarian User',
      role: UserRole.LIBRARIAN,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'admin1',
      libraryIds: ['lib-1']
    };

    mockUsers = [mockAdmin, mockUser, mockLibrarian];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('assignRole', () => {
    beforeEach(() => {
      auditService.logRoleChange$.mockReturnValue(of({
        id: 'audit-1',
        userId: 'user1',
        action: 'role_change',
        oldRole: UserRole.USER,
        newRole: UserRole.LIBRARIAN,
        changedBy: 'admin1',
        timestamp: new Date()
      }));
    });

    it('should successfully assign role when admin makes valid change', async () => {
      datastoreService.get.mockResolvedValueOnce(mockAdmin); // Current user is admin
      datastoreService.get.mockResolvedValueOnce(mockUser); // Target user exists
      datastoreService.save.mockResolvedValue(undefined);

      const result = await service.assignRole('admin1', 'user1', UserRole.LIBRARIAN);

      expect(result.success).toBe(true);
      expect(result.newRole).toBe(UserRole.LIBRARIAN);
      expect(result.previousRole).toBe(UserRole.USER);
      expect(datastoreService.save).toHaveBeenCalled();
      expect(auditService.logRoleChange$).toHaveBeenCalledWith(
        'user1',
        UserRole.USER,
        UserRole.LIBRARIAN,
        'admin1'
      );
    });

    it('should fail if current user is not admin', async () => {
      datastoreService.get.mockResolvedValue(mockUser); // Current user is not admin

      const result = await service.assignRole('user1', 'user2', UserRole.LIBRARIAN);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only administrators can assign roles');
      expect(datastoreService.save).not.toHaveBeenCalled();
    });

    it('should fail if trying to modify own role', async () => {
      datastoreService.get.mockResolvedValue(mockAdmin);

      const result = await service.assignRole('admin1', 'admin1', UserRole.USER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You cannot modify your own role');
      expect(datastoreService.save).not.toHaveBeenCalled();
    });

    it('should fail if target user does not exist', async () => {
      datastoreService.get.mockResolvedValueOnce(mockAdmin); // Current user
      datastoreService.get.mockResolvedValueOnce(null); // Target user not found

      const result = await service.assignRole('admin1', 'user999', UserRole.LIBRARIAN);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(datastoreService.save).not.toHaveBeenCalled();
    });

    it('should fail if demoting last admin', async () => {
      datastoreService.get.mockResolvedValueOnce(mockAdmin); // Current user
      datastoreService.get.mockResolvedValueOnce(mockAdmin); // Target user (same admin)
      datastoreService.query.mockResolvedValue([mockAdmin]); // Only one admin

      const result = await service.assignRole('admin1', 'admin2', UserRole.USER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot demote the last administrator');
    });

    it('should clear libraryIds when changing from LIBRARIAN to another role', async () => {
      datastoreService.get.mockResolvedValueOnce(mockAdmin);
      datastoreService.get.mockResolvedValueOnce(mockLibrarian);
      datastoreService.save.mockResolvedValue(undefined);

      await service.assignRole('admin1', 'lib1', UserRole.USER);

      const saveCall = datastoreService.save.mock.calls[datastoreService.save.mock.calls.length - 1];
      const savedUser = saveCall[1] as User;
      expect(savedUser.libraryIds).toBeUndefined();
    });

    it('should preserve libraryIds when changing to LIBRARIAN role', async () => {
      datastoreService.get.mockResolvedValueOnce(mockAdmin);
      datastoreService.get.mockResolvedValueOnce(mockUser);
      datastoreService.save.mockResolvedValue(undefined);

      await service.assignRole('admin1', 'user1', UserRole.LIBRARIAN);

      const saveCall = datastoreService.save.mock.calls[datastoreService.save.mock.calls.length - 1];
      const savedUser = saveCall[1] as User;
      expect(savedUser.libraryIds).toBeUndefined(); // User had no libraries
    });
  });

  describe('getUsersExcept', () => {
    it('should return all users except specified user', async () => {
      datastoreService.query.mockResolvedValue(mockUsers);

      const result = await service.getUsersExcept('admin1');

      expect(result.length).toBe(2);
      expect(result.find(u => u.id === 'admin1')).toBeUndefined();
      expect(result.find(u => u.id === 'user1')).toBeDefined();
      expect(result.find(u => u.id === 'lib1')).toBeDefined();
    });

    it('should return empty array if only one user exists', async () => {
      datastoreService.query.mockResolvedValue([mockAdmin]);

      const result = await service.getUsersExcept('admin1');

      expect(result.length).toBe(0);
    });
  });

  describe('getUser', () => {
    it('should return user if exists', async () => {
      datastoreService.get.mockResolvedValue(mockUser);

      const result = await service.getUser('user1');

      expect(result).toEqual(mockUser);
      expect(datastoreService.get).toHaveBeenCalledWith('User', 'user1');
    });

    it('should return null if user does not exist', async () => {
      datastoreService.get.mockResolvedValue(null);

      const result = await service.getUser('user999');

      expect(result).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      datastoreService.get.mockResolvedValue(mockAdmin);

      const result = await service.isAdmin('admin1');

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      datastoreService.get.mockResolvedValue(mockUser);

      const result = await service.isAdmin('user1');

      expect(result).toBe(false);
    });

    it('should return false if user does not exist', async () => {
      datastoreService.get.mockResolvedValue(null);

      const result = await service.isAdmin('user999');

      expect(result).toBe(false);
    });
  });

  describe('countAdmins', () => {
    it('should return count of admin users', async () => {
      const usersWithMultipleAdmins = [
        mockAdmin,
        {...mockUser, id: 'admin2', role: UserRole.ADMIN},
        mockUser,
        mockLibrarian
      ];
      datastoreService.query.mockResolvedValue(usersWithMultipleAdmins);

      const count = await service.countAdmins();

      expect(count).toBe(2);
    });

    it('should return 0 if no admins exist', async () => {
      datastoreService.query.mockResolvedValue([mockUser, mockLibrarian]);

      const count = await service.countAdmins();

      expect(count).toBe(0);
    });
  });

  describe('assignLibraries', () => {
    it('should successfully assign libraries to librarian', async () => {
      datastoreService.get.mockResolvedValue(mockLibrarian);
      datastoreService.query.mockResolvedValue([
        {id: 'lib-1', name: 'Library 1'},
        {id: 'lib-2', name: 'Library 2'}
      ]);
      datastoreService.save.mockResolvedValue(undefined);

      await service.assignLibraries('lib1', ['lib-1', 'lib-2']);

      expect(datastoreService.save).toHaveBeenCalled();
      const saveCall = datastoreService.save.mock.calls[datastoreService.save.mock.calls.length - 1];
      const savedUser = saveCall[1] as User;
      expect(savedUser.libraryIds).toEqual(['lib-1', 'lib-2']);
    });

    it('should throw error if user not found', async () => {
      datastoreService.get.mockResolvedValue(null);

      await expect(service.assignLibraries('user999', ['lib-1']))
        .rejects.toThrow('User not found');
    });

    it('should throw error if user is not librarian', async () => {
      datastoreService.get.mockResolvedValue(mockUser);

      await expect(service.assignLibraries('user1', ['lib-1']))
        .rejects.toThrow('Can only assign libraries to librarians');
    });

    it('should throw error if library IDs are invalid', async () => {
      datastoreService.get.mockResolvedValue(mockLibrarian);
      datastoreService.query.mockResolvedValue([
        {id: 'lib-1', name: 'Library 1'}
      ]);

      await expect(service.assignLibraries('lib1', ['lib-1', 'lib-999']))
        .rejects.toThrow('Invalid library IDs: lib-999');
    });

    it('should allow empty library array', async () => {
      datastoreService.get.mockResolvedValue(mockLibrarian);
      datastoreService.save.mockResolvedValue(undefined);

      await service.assignLibraries('lib1', []);

      expect(datastoreService.save).toHaveBeenCalled();
    });
  });

  describe('getAssignedLibraries', () => {
    it('should return library IDs for librarian', async () => {
      datastoreService.get.mockResolvedValue(mockLibrarian);

      const result = await service.getAssignedLibraries('lib1');

      expect(result).toEqual(['lib-1']);
    });

    it('should return empty array if user has no libraries', async () => {
      datastoreService.get.mockResolvedValue(mockUser);

      const result = await service.getAssignedLibraries('user1');

      expect(result).toEqual([]);
    });

    it('should return empty array if user not found', async () => {
      datastoreService.get.mockResolvedValue(null);

      const result = await service.getAssignedLibraries('user999');

      expect(result).toEqual([]);
    });
  });
});
