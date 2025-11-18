import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { LibraryService } from '../../core/services/library.service';
import { AuthMockService } from '../../core/services/mock/auth-mock.service';
import { Library } from '../../core/models/library.model';

/**
 * LibraryFormComponent
 *
 * Form for creating and editing libraries.
 *
 * Features:
 * - Reactive form with validation
 * - Create mode (no ID in route)
 * - Edit mode (ID in route params)
 * - Auto-populate form in edit mode
 * - Form validation feedback
 * - Cancel navigation
 */
@Component({
  selector: 'sfeir-library-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './library-form.component.html',
  styleUrl: './library-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private libraryService = inject(LibraryService);
  private authService = inject(AuthMockService);

  form!: FormGroup;
  isEditMode = signal(false);
  libraryId = signal<string | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      location: ['', [Validators.maxLength(500)]]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.libraryId.set(id);
      this.loadLibrary(id);
    }
  }

  private loadLibrary(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.libraryService.getById(id).subscribe({
      next: (library) => {
        if (library) {
          this.form.patchValue({
            name: library.name,
            description: library.description || '',
            location: library.location || ''
          });
        } else {
          this.error.set('Library not found');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load library');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.error.set('You must be logged in to perform this action');
      this.isSaving.set(false);
      return;
    }

    if (this.isEditMode()) {
      const id = this.libraryId();
      if (id) {
        this.libraryService.update(id, formValue).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.router.navigate(['/library', id]);
          },
          error: () => {
            this.error.set('Failed to update library');
            this.isSaving.set(false);
          }
        });
      }
    } else {
      this.libraryService.create({
        ...formValue,
        createdBy: currentUser.id
      }).subscribe({
        next: (library) => {
          this.isSaving.set(false);
          this.router.navigate(['/library', library.id]);
        },
        error: () => {
          this.error.set('Failed to create library');
          this.isSaving.set(false);
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode()) {
      const id = this.libraryId();
      if (id) {
        this.router.navigate(['/library', id]);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be less than ${maxLength} characters`;
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Library name',
      description: 'Description',
      location: 'Location'
    };
    return labels[fieldName] || fieldName;
  }

  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
