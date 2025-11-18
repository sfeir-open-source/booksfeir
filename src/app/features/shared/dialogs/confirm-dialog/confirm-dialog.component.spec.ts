import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  const defaultDialogData: ConfirmDialogData = {
    title: 'Test Title',
    message: 'Test message content'
  };

  function createComponent(data: ConfirmDialogData = defaultDialogData) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('Dialog Content', () => {
    it('should display title from dialog data', () => {
      createComponent();

      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toBe('Test Title');
    });

    it('should display message from dialog data', () => {
      createComponent();

      const message = fixture.debugElement.query(By.css('mat-dialog-content p'));
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent).toBe('Test message content');
    });

    it('should display custom title and message', () => {
      createComponent({
        title: 'Delete Library?',
        message: 'Are you sure you want to delete this library?'
      });

      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      const message = fixture.debugElement.query(By.css('mat-dialog-content p'));

      expect(title.nativeElement.textContent).toBe('Delete Library?');
      expect(message.nativeElement.textContent).toBe('Are you sure you want to delete this library?');
    });
  });

  describe('Cancel Button', () => {
    it('should display default cancel text when not provided', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const cancelButton = buttons[0];

      expect(cancelButton.nativeElement.textContent.trim()).toBe('Cancel');
    });

    it('should display custom cancel text when provided', () => {
      createComponent({
        ...defaultDialogData,
        cancelText: 'No, Go Back'
      });

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const cancelButton = buttons[0];

      expect(cancelButton.nativeElement.textContent.trim()).toBe('No, Go Back');
    });

    it('should have cancel button type as button', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const cancelButton = buttons[0];

      // Verify button type
      expect(cancelButton.nativeElement.getAttribute('type')).toBe('button');
    });

    it('should be a regular mat-button', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const cancelButton = buttons[0];

      expect(cancelButton.nativeElement.hasAttribute('mat-button')).toBe(true);
      expect(cancelButton.nativeElement.hasAttribute('mat-raised-button')).toBe(false);
    });
  });

  describe('Confirm Button', () => {
    it('should display default confirm text when not provided', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const confirmButton = buttons[1];

      expect(confirmButton.nativeElement.textContent.trim()).toBe('Confirm');
    });

    it('should display custom confirm text when provided', () => {
      createComponent({
        ...defaultDialogData,
        confirmText: 'Delete'
      });

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const confirmButton = buttons[1];

      expect(confirmButton.nativeElement.textContent.trim()).toBe('Delete');
    });

    it('should have confirm button type as button', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const confirmButton = buttons[1];

      // Verify button type
      expect(confirmButton.nativeElement.getAttribute('type')).toBe('button');
    });

    it('should be a raised button', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const confirmButton = buttons[1];

      // Verify it's a raised button
      expect(confirmButton.nativeElement.hasAttribute('mat-raised-button')).toBe(true);
    });
  });

  describe('Button Layout', () => {
    it('should have two buttons', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      expect(buttons.length).toBe(2);
    });

    it('should align buttons to the end', () => {
      createComponent();

      const actions = fixture.debugElement.query(By.css('mat-dialog-actions'));
      expect(actions.nativeElement.getAttribute('align')).toBe('end');
    });

    it('should have cancel button first, confirm button second', () => {
      createComponent({
        ...defaultDialogData,
        cancelText: 'Cancel',
        confirmText: 'Confirm'
      });

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));

      expect(buttons[0].nativeElement.textContent.trim()).toBe('Cancel');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Confirm');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types', () => {
      createComponent();

      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));

      buttons.forEach(button => {
        expect(button.nativeElement.getAttribute('type')).toBe('button');
      });
    });

    it('should use semantic dialog structure', () => {
      createComponent();

      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      const content = fixture.debugElement.query(By.css('mat-dialog-content'));
      const actions = fixture.debugElement.query(By.css('mat-dialog-actions'));

      expect(title).toBeTruthy();
      expect(content).toBeTruthy();
      expect(actions).toBeTruthy();
    });
  });

  describe('Full Dialog Configuration', () => {
    it('should support all custom options together', () => {
      createComponent({
        title: 'Delete Book?',
        message: 'This will permanently remove the book from the library.',
        confirmText: 'Delete Permanently',
        cancelText: 'Keep Book'
      });

      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      const message = fixture.debugElement.query(By.css('mat-dialog-content p'));
      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));

      expect(title.nativeElement.textContent).toBe('Delete Book?');
      expect(message.nativeElement.textContent).toBe('This will permanently remove the book from the library.');
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Keep Book');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Delete Permanently');
    });
  });

  describe('Component Properties', () => {
    it('should inject dialog data', () => {
      createComponent();

      expect(component.data).toBeTruthy();
      expect(component.data.title).toBe('Test Title');
      expect(component.data.message).toBe('Test message content');
    });

    it('should inject dialog reference', () => {
      createComponent();

      expect(component.dialogRef).toBeTruthy();
      expect(component.dialogRef).toBe(dialogRefSpy);
    });
  });
});
