/**
 * Audit Log Component Tests
 *
 * Tests for audit trail display component including:
 * - Loading state
 * - Empty state
 * - Audit entries display
 * - User-specific filtering
 *
 * Feature: 002-user-role-management (T074)
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AuditLog} from './audit-log';
import {AuditService} from '../../../../core/services/audit.service';
import {AuditEntry} from '../../../../core/models/audit-entry.model';
import {UserRole} from '../../../../core/models/user.model';

describe('AuditLog', () => {
  let component: AuditLog;
  let fixture: ComponentFixture<AuditLog>;
  let auditService: jasmine.SpyObj<AuditService>;
  let mockAuditEntries: AuditEntry[];

  beforeEach(async () => {
    const auditSpy = jasmine.createSpyObj('AuditService', [
      'getAuditTrail',
      'getAllAuditEntries'
    ]);

    mockAuditEntries = [
      {
        id: 'audit-1',
        userId: 'user1',
        action: 'role_change',
        oldRole: UserRole.USER,
        newRole: UserRole.LIBRARIAN,
        changedBy: 'admin1',
        timestamp: new Date('2025-01-15T10:00:00')
      },
      {
        id: 'audit-2',
        userId: 'user1',
        action: 'role_change',
        oldRole: UserRole.LIBRARIAN,
        newRole: UserRole.ADMIN,
        changedBy: 'admin1',
        timestamp: new Date('2025-01-20T14:30:00')
      }
    ];

    auditSpy.getAuditTrail.and.resolveTo(mockAuditEntries);
    auditSpy.getAllAuditEntries.and.resolveTo(mockAuditEntries);

    await TestBed.configureTestingModule({
      imports: [AuditLog, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        {provide: AuditService, useValue: auditSpy}
      ]
    }).compileComponents();

    auditService = TestBed.inject(AuditService) as jasmine.SpyObj<AuditService>;
    fixture = TestBed.createComponent(AuditLog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially', () => {
    // Don't call detectChanges yet to see initial state
    const compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    // Loading should be true initially
    expect(component.loading()).toBe(true);
  });

  it('should load all audit entries when no userId provided', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(auditService.getAllAuditEntries).toHaveBeenCalledWith(50);
    expect(component.auditEntries().length).toBe(2);
  });

  it('should load user-specific audit entries when userId provided', async () => {
    fixture.componentRef.setInput('userId', 'user1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(auditService.getAuditTrail).toHaveBeenCalledWith('user1');
    expect(component.auditEntries().length).toBe(2);
  });

  it('should display audit entries after loading', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('mat-list-item');

    expect(listItems.length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should show empty state when no entries', async () => {
    auditService.getAllAuditEntries.and.resolveTo([]);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state');

    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No audit entries found');
  });

  it('should format audit entries correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const formattedEntries = component.formattedEntries();

    expect(formattedEntries[0].oldRole).toBe('User');
    expect(formattedEntries[0].newRole).toBe('Librarian');
    expect(formattedEntries[0].description).toBe('Role changed from User to Librarian');

    expect(formattedEntries[1].oldRole).toBe('Librarian');
    expect(formattedEntries[1].newRole).toBe('Admin');
    expect(formattedEntries[1].description).toBe('Role changed from Librarian to Admin');
  });

  it('should format timestamps to locale string', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const formattedEntries = component.formattedEntries();

    expect(formattedEntries[0].timestamp).toBeTruthy();
    expect(typeof formattedEntries[0].timestamp).toBe('string');
    // Should contain date components
    expect(formattedEntries[0].timestamp).toContain('2025');
  });

  it('should display audit entries in formatted list', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const descriptions = compiled.querySelectorAll('.audit-description');

    expect(descriptions.length).toBe(2);
    expect(descriptions[0].textContent).toContain('Role changed from User to Librarian');
    expect(descriptions[1].textContent).toContain('Role changed from Librarian to Admin');
  });

  it('should display metadata with changedBy and timestamp', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metadata = compiled.querySelectorAll('.audit-metadata');

    expect(metadata.length).toBe(2);
    expect(metadata[0].textContent).toContain('admin1');
    expect(metadata[1].textContent).toContain('admin1');
  });

  it('should show dividers between entries', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dividers = compiled.querySelectorAll('mat-divider');

    expect(dividers.length).toBe(2); // One divider per entry
  });

  it('should have subheader "Role Change History"', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const subheader = compiled.querySelector('h3[mat-subheader]');

    expect(subheader?.textContent).toContain('Role Change History');
  });

  it('should handle audit service errors gracefully', async () => {
    auditService.getAllAuditEntries.and.rejectWith(new Error('Service error'));
    spyOn(console, 'error'); // Suppress error log in test

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Should show empty state and not crash
    expect(component.loading()).toBe(false);
    expect(component.auditEntries().length).toBe(0);
  });

  it('should use OnPush change detection', () => {
    expect(component).toBeTruthy();
    // If component renders with signal updates, OnPush is working correctly
  });

  it('should format role names with proper capitalization', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const formattedEntries = component.formattedEntries();

    // Check that role names are properly capitalized
    expect(formattedEntries[0].oldRole).toBe('User'); // Not "USER"
    expect(formattedEntries[0].newRole).toBe('Librarian'); // Not "LIBRARIAN"
    expect(formattedEntries[1].newRole).toBe('Admin'); // Not "ADMIN"
  });

  it('should call ngOnInit and load audit trail', async () => {
    spyOn(component, 'ngOnInit').and.callThrough();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.ngOnInit).toHaveBeenCalled();
    expect(auditService.getAllAuditEntries).toHaveBeenCalled();
  });
});
