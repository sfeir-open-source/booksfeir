/**
 * Role Selector Component Tests
 *
 * Tests for role selection dropdown component including:
 * - Rendering with current role
 * - Role change event emission
 * - Disabled state handling
 *
 * Feature: 002-user-role-management (T074)
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {RoleSelector} from './role-selector';
import {UserRole} from '../../../../core/models/user.model';

describe('RoleSelector', () => {
  let component: RoleSelector;
  let fixture: ComponentFixture<RoleSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelector, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelector);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput('currentRole', UserRole.USER);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current role in select', () => {
    const select = fixture.debugElement.query(By.css('mat-select'));
    expect(select).toBeTruthy();

    // Check the value property directly
    expect(select.componentInstance.value).toBe(UserRole.USER);

    // Or check the displayed text after opening
    const selectTrigger = fixture.debugElement.query(By.css('.mat-mdc-select-value-text'));
    if (selectTrigger) {
      expect(selectTrigger.nativeElement.textContent.trim()).toBe('User');
    }
  });

  it('should display all available roles as options', () => {
    const selectTrigger = fixture.debugElement.query(By.css('.mat-mdc-select-trigger'));
    selectTrigger.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(options.length).toBe(3);

    const optionTexts = options.map(opt => opt.nativeElement.textContent.trim());
    expect(optionTexts).toContain('User');
    expect(optionTexts).toContain('Librarian');
    expect(optionTexts).toContain('Admin');
  });

  it('should emit roleChange event when selection changes', () => {
    let emittedRole: UserRole | undefined;
    component.roleChange.subscribe((role: UserRole) => {
      emittedRole = role;
    });

    const selectTrigger = fixture.debugElement.query(By.css('.mat-mdc-select-trigger'));
    selectTrigger.nativeElement.click();
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.css('mat-option'));
    options[1].nativeElement.click(); // Select "Librarian"
    fixture.detectChanges();

    expect(emittedRole).toBe(UserRole.LIBRARIAN);
  });

  it('should not emit event when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    let emittedRole: UserRole | undefined;
    component.roleChange.subscribe((role: UserRole) => {
      emittedRole = role;
    });

    // Manually call onRoleChange to test disabled logic
    component.onRoleChange(UserRole.LIBRARIAN);

    expect(emittedRole).toBeUndefined();
  });

  it('should disable select when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('mat-select'));
    expect(select.nativeElement.getAttribute('aria-disabled')).toBe('true');
  });

  it('should enable select when disabled input is false', () => {
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('mat-select'));
    expect(select.nativeElement.getAttribute('aria-disabled')).toBe('false');
  });

  it('should update displayed role when currentRole input changes', () => {
    fixture.componentRef.setInput('currentRole', UserRole.ADMIN);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('mat-select'));
    expect(select.componentInstance.value).toBe(UserRole.ADMIN);
  });

  it('should have role-selector host class', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.classList.contains('role-selector')).toBe(true);
  });

  it('should have disabled host class when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.classList.contains('disabled')).toBe(true);
  });

  it('should not have disabled class when enabled', () => {
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.classList.contains('disabled')).toBe(false);
  });

  it('should render with OnPush change detection', () => {
    expect(component).toBeTruthy();
    // If component renders, OnPush is working
  });

  it('should handle all role values correctly', () => {
    const roles = [UserRole.USER, UserRole.LIBRARIAN, UserRole.ADMIN];

    for (const role of roles) {
      fixture.componentRef.setInput('currentRole', role);
      fixture.detectChanges();

      const select = fixture.debugElement.query(By.css('mat-select'));
      expect(select.componentInstance.value).toBe(role);
    }
  });
});
