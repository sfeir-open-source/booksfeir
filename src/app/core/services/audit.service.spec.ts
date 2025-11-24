/**
 * AuditService Unit Tests
 *
 * Tests for audit trail management including:
 * - Role change logging
 * - Audit trail retrieval
 * - Old entry cleanup
 *
 * Feature: 002-user-role-management (T074)
 */

import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {AuditService} from './audit.service';
import {DatastoreService} from './datastore.service';
import {UserRole} from '../models/user.model';
import {AuditEntry} from '../models/audit-entry.model';
import {vi} from 'vitest';

describe('AuditService', () => {
  let service: AuditService;
  let datastoreService: any;
  let mockAuditEntries: AuditEntry[];

  beforeEach(() => {
    // Create spy for DatastoreService
    const datastoreSpy = {
      save: vi.fn(),
      query: vi.fn(),
      batchDelete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuditService,
        {provide: DatastoreService, useValue: datastoreSpy}
      ]
    });

    service = TestBed.inject(AuditService);
    datastoreService = TestBed.inject(DatastoreService) as any;

    // Setup mock audit entries with recent dates
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    mockAuditEntries = [
      {
        id: 'audit-1',
        userId: 'user1',
        action: 'role_change',
        oldRole: UserRole.USER,
        newRole: UserRole.LIBRARIAN,
        changedBy: 'admin1',
        timestamp: fiveDaysAgo
      },
      {
        id: 'audit-2',
        userId: 'user1',
        action: 'role_change',
        oldRole: UserRole.LIBRARIAN,
        newRole: UserRole.ADMIN,
        changedBy: 'admin1',
        timestamp: oneDayAgo
      },
      {
        id: 'audit-3',
        userId: 'user2',
        action: 'role_change',
        oldRole: UserRole.USER,
        newRole: UserRole.LIBRARIAN,
        changedBy: 'admin1',
        timestamp: twoDaysAgo
      }
    ];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('logRoleChange', () => {
    it('should create and save audit entry', async () => {
      datastoreService.save.mockResolvedValue(undefined);

      const result = await service.logRoleChange(
        'user1',
        UserRole.USER,
        UserRole.LIBRARIAN,
        'admin1'
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user1');
      expect(result.oldRole).toBe(UserRole.USER);
      expect(result.newRole).toBe(UserRole.LIBRARIAN);
      expect(result.changedBy).toBe('admin1');
      expect(result.action).toBe('role_change');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(datastoreService.save).toHaveBeenCalledWith('AuditEntry', expect.any(Object));
    });

    it('should generate unique audit entry IDs', async () => {
      datastoreService.save.mockResolvedValue(undefined);

      const entry1 = await service.logRoleChange('user1', UserRole.USER, UserRole.LIBRARIAN, 'admin1');
      const entry2 = await service.logRoleChange('user2', UserRole.USER, UserRole.ADMIN, 'admin1');

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit entries for specific user sorted by timestamp desc', async () => {
      datastoreService.query.mockResolvedValue(mockAuditEntries);

      const result = await service.getAuditTrail('user1');

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('audit-2'); // Most recent first
      expect(result[1].id).toBe('audit-1');
      expect(result.every(entry => entry.userId === 'user1')).toBe(true);
    });

    it('should return empty array if user has no audit entries', async () => {
      datastoreService.query.mockResolvedValue(mockAuditEntries);

      const result = await service.getAuditTrail('user999');

      expect(result.length).toBe(0);
    });
  });

  describe('getAllAuditEntries', () => {
    it('should return all audit entries sorted by timestamp desc', async () => {
      datastoreService.query.mockResolvedValue(mockAuditEntries);

      const result = await service.getAllAuditEntries();

      expect(result.length).toBe(3);
      expect(result[0].id).toBe('audit-2'); // Most recent first (1 day ago)
      expect(result[1].id).toBe('audit-3'); // 2 days ago
      expect(result[2].id).toBe('audit-1'); // 5 days ago
    });

    it('should respect limit parameter', async () => {
      datastoreService.query.mockResolvedValue(mockAuditEntries);

      const result = await service.getAllAuditEntries(2);

      expect(result.length).toBe(2);
    });

    it('should use default limit of 100 if not specified', async () => {
      const manyEntries = Array.from({length: 150}, (_, i) => ({
        id: `audit-${i}`,
        userId: 'user1',
        action: 'role_change' as const,
        oldRole: UserRole.USER,
        newRole: UserRole.LIBRARIAN,
        changedBy: 'admin1',
        timestamp: new Date()
      }));
      datastoreService.query.mockResolvedValue(manyEntries);

      const result = await service.getAllAuditEntries();

      expect(result.length).toBe(100);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should delete entries older than 30 days', async () => {
      const now = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      const entriesWithOld = [
        ...mockAuditEntries,
        {
          id: 'audit-old',
          userId: 'user1',
          action: 'role_change' as const,
          oldRole: UserRole.USER,
          newRole: UserRole.LIBRARIAN,
          changedBy: 'admin1',
          timestamp: oldDate
        }
      ];

      datastoreService.query.mockResolvedValue(entriesWithOld);
      datastoreService.batchDelete.mockResolvedValue(undefined);

      const deletedCount = await service.cleanupOldEntries();

      expect(deletedCount).toBe(1);
      expect(datastoreService.batchDelete).toHaveBeenCalledWith('AuditEntry', ['audit-old']);
    });

    it('should return 0 if no old entries exist', async () => {
      datastoreService.query.mockResolvedValue(mockAuditEntries);

      const deletedCount = await service.cleanupOldEntries();

      expect(deletedCount).toBe(0);
      expect(datastoreService.batchDelete).not.toHaveBeenCalled();
    });

    it('should delete multiple old entries', async () => {
      const oldDate1 = new Date();
      oldDate1.setDate(oldDate1.getDate() - 31);
      const oldDate2 = new Date();
      oldDate2.setDate(oldDate2.getDate() - 40);

      const entriesWithMultipleOld = [
        ...mockAuditEntries,
        {
          id: 'audit-old-1',
          userId: 'user1',
          action: 'role_change' as const,
          oldRole: UserRole.USER,
          newRole: UserRole.LIBRARIAN,
          changedBy: 'admin1',
          timestamp: oldDate1
        },
        {
          id: 'audit-old-2',
          userId: 'user2',
          action: 'role_change' as const,
          oldRole: UserRole.USER,
          newRole: UserRole.ADMIN,
          changedBy: 'admin1',
          timestamp: oldDate2
        }
      ];

      datastoreService.query.mockResolvedValue(entriesWithMultipleOld);
      datastoreService.batchDelete.mockResolvedValue(undefined);

      const deletedCount = await service.cleanupOldEntries();

      expect(deletedCount).toBe(2);
      expect(datastoreService.batchDelete).toHaveBeenCalledWith(
        'AuditEntry',
        expect.arrayContaining(['audit-old-1', 'audit-old-2'])
      );
    });
  });
});
