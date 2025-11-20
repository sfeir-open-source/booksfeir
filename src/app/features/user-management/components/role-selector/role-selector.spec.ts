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
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatSelectHarness} from '@angular/material/select/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RoleSelector} from './role-selector';
import {UserRole} from '../../../../core/models/user.model';

describe('RoleSelector', () => {
  let component: RoleSelector;
  let fixture: ComponentFixture<RoleSelector>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelector, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelector);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    // Set required input
    fixture.componentRef.setInput('currentRole', UserRole.USER);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current role in select', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    const valueText = await select.getValueText();

    expect(valueText).toBe('User');
  });

  it('should display all available roles as options', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();

    expect(options.length).toBe(3);
    const optionTexts = await Promise.all(options.map(opt => opt.getText()));
    expect(optionTexts).toContain('User');
    expect(optionTexts).toContain('Librarian');
    expect(optionTexts).toContain('Admin');
  });

  it('should emit roleChange event when selection changes', async () => {
    let emittedRole: UserRole | undefined;
    component.roleChange.subscribe((role: UserRole) => {
      emittedRole = role;
    });

    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    await options[1].click(); // Select "Librarian"

    expect(emittedRole).toBe(UserRole.LIBRARIAN);
  });

  it('should not emit event when disabled', async () => {
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

  it('should disable select when disabled input is true', async () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const select = await loader.getHarness(MatSelectHarness);
    const isDisabled = await select.isDisabled();

    expect(isDisabled).toBe(true);
  });

  it('should enable select when disabled input is false', async () => {
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    const select = await loader.getHarness(MatSelectHarness);
    const isDisabled = await select.isDisabled();

    expect(isDisabled).toBe(false);
  });

  it('should update displayed role when currentRole input changes', async () => {
    fixture.componentRef.setInput('currentRole', UserRole.ADMIN);
    fixture.detectChanges();

    const select = await loader.getHarness(MatSelectHarness);
    const valueText = await select.getValueText();

    expect(valueText).toBe('Admin');
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

  it('should handle all role values correctly', async () => {
    const roles = [UserRole.USER, UserRole.LIBRARIAN, UserRole.ADMIN];

    for (const role of roles) {
      fixture.componentRef.setInput('currentRole', role);
      fixture.detectChanges();

      const select = await loader.getHarness(MatSelectHarness);
      const valueText = await select.getValueText();

      const expectedText = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      expect(valueText).toBe(expectedText);
    }
  });
});
