import {Component, computed, inject, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {catchError, EMPTY, filter, map, merge, Subject, switchMap, tap} from 'rxjs';
import {LibraryService} from '../../core/services/library.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';

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
  styleUrl: './library-form.component.scss'
})
export class LibraryFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private libraryService = inject(LibraryService);
  private authService = inject(AuthMockService);

  // Form initialization
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
    location: ['', [Validators.maxLength(500)]]
  });

  // Signals for state
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);

  // Subjects for user actions
  private submitTrigger$ = new Subject<void>();

  // Reactive route params → library ID
  private libraryId$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    tap(id => {
      if (id) {
        this.isLoading.set(true);
        this.error.set(null);
      }
    })
  );

  // Reactive data loading: load library in edit mode
  private libraryData$ = this.libraryId$.pipe(
    filter((id): id is string => id !== null),
    switchMap(id =>
      this.libraryService.getById(id).pipe(
        tap(library => {
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
        }),
        catchError(() => {
          this.error.set('Failed to load library');
          this.isLoading.set(false);
          return EMPTY;
        })
      )
    )
  );

  // Reactive form submission
  private submitResult$ = this.submitTrigger$.pipe(
    tap(() => {
      this.isSaving.set(true);
      this.error.set(null);
    }),
    switchMap(() => {
      const formValue = this.form.value;
      const currentUser = this.authService.currentUser();
      const libraryId = this.libraryId();

      if (!currentUser) {
        this.error.set('You must be logged in to perform this action');
        this.isSaving.set(false);
        return EMPTY;
      }

      // Edit mode
      if (libraryId) {
        return this.libraryService.update(libraryId, formValue).pipe(
          tap(() => {
            this.isSaving.set(false);
            this.router.navigate(['/library', libraryId]);
          }),
          catchError(() => {
            this.error.set('Failed to update library');
            this.isSaving.set(false);
            return EMPTY;
          })
        );
      }

      // Create mode
      return this.libraryService.create({
        ...formValue,
        createdBy: currentUser.id
      }).pipe(
        tap(library => {
          this.isSaving.set(false);
          this.router.navigate(['/library', library.id]);
        }),
        catchError(() => {
          this.error.set('Failed to create library');
          this.isSaving.set(false);
          return EMPTY;
        })
      );
    })
  );

  // Merge all streams and subscribe with toSignal
  private allStreams$ = merge(this.libraryData$, this.submitResult$);
  private streamSignal = toSignal(this.allStreams$);

  // Computed signals
  libraryId = toSignal(this.libraryId$, {initialValue: null});
  isEditMode = computed(() => this.libraryId() !== null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitTrigger$.next();
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
