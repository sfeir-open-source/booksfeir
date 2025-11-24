import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

/**
 * ConfirmDialogComponent
 *
 * Reusable confirmation dialog for destructive actions (e.g., delete operations).
 *
 * Usage:
 * ```typescript
 * const dialogRef = this.dialog.open(ConfirmDialogComponent, {
 *   data: {
 *     title: 'Delete Library?',
 *     message: 'Are you sure you want to delete this library? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     cancelText: 'Cancel'
 *   }
 * });
 *
 * dialogRef.afterClosed().subscribe(result => {
 *   if (result) {
 *     // User confirmed
 *   }
 * });
 * ```
 */

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;  // Defaults to 'Confirm'
  cancelText?: string;   // Defaults to 'Cancel'
}

@Component({
  selector: 'sfeir-confirm-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-button
        [mat-dialog-close]="false"
        type="button"
      >
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button
        mat-raised-button
        color="warn"
        [mat-dialog-close]="true"
        type="button"
      >
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px 0;
      min-width: 300px;
    }

    mat-dialog-actions {
      padding: 12px 0;
      gap: 8px;
    }

    p {
      margin: 0;
      line-height: 1.5;
    }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
