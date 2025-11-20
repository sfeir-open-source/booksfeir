import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {BookService} from '../../core/services/book.service';
import {LibraryService} from '../../core/services/library.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Library} from '../../core/models/library.model';
import {catchError, filter, map, of, switchMap} from 'rxjs';

/**
 * BookFormComponent
 *
 * Form for creating and editing books within a library.
 *
 * Features:
 * - Reactive form with validation
 * - Create mode (no book ID in route, library ID required)
 * - Edit mode (book ID in route params)
 * - Auto-populate form in edit mode
 * - Library selection (create mode only)
 * - Form validation feedback
 * - Cancel navigation
 */
@Component({
  selector: 'sfeir-book-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private libraryService = inject(LibraryService);
  private authService = inject(AuthMockService);

  form!: FormGroup;
  bookId = signal<string | null>(null);
  libraryId = signal<string | null>(null);

  // Load libraries using toSignal
  libraries = toSignal(
    this.libraryService.getAll().pipe(
      catchError(() => of([]))
    ),
    {initialValue: []}
  );

  // Load book for editing using toSignal
  private bookData = toSignal(
    toObservable(this.bookId).pipe(
      switchMap(id => {
        if (!id) {
          return of({data: null, error: null, loading: false});
        }
        return this.bookService.getById(id).pipe(
          map(book => ({data: book, error: null, loading: false})),
          catchError(() => of({data: null, error: 'Failed to load book', loading: false}))
        );
      })
    ),
    {initialValue: {data: null, error: null, loading: false}}
  );

  // Save trigger for form submission
  private saveTrigger = signal<{ action: 'create' | 'update'; data: any } | null>(null);

  // Handle save operation with signals
  private saveResult = toSignal(
    toObservable(this.saveTrigger).pipe(
      filter(trigger => trigger !== null),
      switchMap(trigger => {
        if (trigger!.action === 'update') {
          const id = this.bookId();
          if (!id) {
            return of({success: false, error: 'No book ID for update', navigateTo: null});
          }
          return this.bookService.update(id, trigger!.data).pipe(
            map(() => ({success: true, error: null, navigateTo: `/library/${this.libraryId()}`})),
            catchError(() => of({success: false, error: 'Failed to update book', navigateTo: null}))
          );
        } else {
          const {libraryId, ...bookData} = trigger!.data;
          const currentUser = this.authService.currentUser();
          return this.bookService.create(libraryId, {...bookData, addedBy: currentUser?.id}).pipe(
            map(() => ({success: true, error: null, navigateTo: `/library/${libraryId}`})),
            catchError(() => of({success: false, error: 'Failed to create book', navigateTo: null}))
          );
        }
      })
    ),
    {initialValue: {success: false, error: null, navigateTo: '/'}}
  );

  // Computed signals
  isEditMode = computed(() => this.bookId() !== null);
  isLoading = computed(() => this.bookData()?.loading || false);

  // Writable signals for form state
  isSaving = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Initialize form once
    this.initializeForm();
    this.checkEditMode();

    // Update form when book data changes
    effect(() => {
      const book = this.bookData()?.data;
      if (book && this.form) {
        this.libraryId.set(book.libraryId);
        this.form.patchValue({
          libraryId: book.libraryId,
          title: book.title,
          author: book.author,
          edition: book.edition || '',
          publicationDate: book.publicationDate || '',
          isbn: book.isbn || '',
          coverImage: book.coverImage || ''
        });
        // Disable library selection in edit mode
        this.form.get('libraryId')?.disable();
      }
    });

    // Effect to handle save result
    effect(() => {
      const result = this.saveResult();
      if (result?.success && result.navigateTo) {
        this.isSaving.set(false);
        this.router.navigate([result.navigateTo]);
        // Reset trigger
        this.saveTrigger.set(null);
      } else if (result?.error) {
        this.error.set(result.error);
        this.isSaving.set(false);
        // Reset trigger
        this.saveTrigger.set(null);
      }
    });
  }

  private initializeForm(): void {
    const libraryIdFromRoute = this.route.snapshot.queryParamMap.get('libraryId');

    this.form = this.fb.group({
      libraryId: [libraryIdFromRoute || '', [Validators.required]],
      title: ['', [Validators.required, Validators.maxLength(500)]],
      author: ['', [Validators.required, Validators.maxLength(200)]],
      edition: ['', [Validators.maxLength(100)]],
      publicationDate: ['', [Validators.maxLength(50)]],
      isbn: ['', [Validators.maxLength(20)]],
      coverImage: ['', [Validators.maxLength(2000)]]
    });

    if (libraryIdFromRoute) {
      this.libraryId.set(libraryIdFromRoute);
    }
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookId.set(id);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('You must be logged in to perform this action');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const formValue = this.form.getRawValue(); // getRawValue() includes disabled fields

    // Trigger save operation via signal
    if (this.isEditMode()) {
      this.saveTrigger.set({action: 'update', data: formValue});
    } else {
      this.saveTrigger.set({action: 'create', data: formValue});
    }
  }

  onCancel(): void {
    const libId = this.libraryId() || this.form.get('libraryId')?.value;
    if (libId) {
      this.router.navigate(['/library', libId]);
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
      libraryId: 'Library',
      title: 'Title',
      author: 'Author',
      edition: 'Edition',
      publicationDate: 'Publication Date',
      isbn: 'ISBN',
      coverImage: 'Cover Image URL'
    };
    return labels[fieldName] || fieldName;
  }

  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
