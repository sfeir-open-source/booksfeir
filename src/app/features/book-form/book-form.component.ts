import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { BookService } from '../../core/services/book.service';
import { LibraryService } from '../../core/services/library.service';
import { AuthMockService } from '../../core/services/mock/auth-mock.service';
import { Book, BookStatus } from '../../core/models/book.model';
import { Library } from '../../core/models/library.model';

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
export class BookFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private libraryService = inject(LibraryService);
  private authService = inject(AuthMockService);

  form!: FormGroup;
  isEditMode = signal(false);
  bookId = signal<string | null>(null);
  libraryId = signal<string | null>(null);
  libraries = signal<Library[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadLibraries();
    this.initializeForm();
    this.checkEditMode();
  }

  private loadLibraries(): void {
    this.libraryService.getAll().subscribe({
      next: (libraries) => {
        this.libraries.set(libraries);
      },
      error: (err) => {
        this.error.set('Failed to load libraries');
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
      this.isEditMode.set(true);
      this.bookId.set(id);
      this.loadBook(id);
    }
  }

  private loadBook(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.bookService.getById(id).subscribe({
      next: (book) => {
        if (book) {
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
        } else {
          this.error.set('Book not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load book');
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

    const formValue = this.form.getRawValue(); // getRawValue() includes disabled fields
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.error.set('You must be logged in to perform this action');
      this.isSaving.set(false);
      return;
    }

    if (this.isEditMode()) {
      const id = this.bookId();
      if (id) {
        this.bookService.update(id, formValue).subscribe({
          next: () => {
            this.isSaving.set(false);
            const libId = this.libraryId();
            this.router.navigate(['/library', libId]);
          },
          error: (err) => {
            this.error.set('Failed to update book');
            this.isSaving.set(false);
          }
        });
      }
    } else {
      const { libraryId, ...bookData } = formValue;
      this.bookService.create(libraryId, {
        ...bookData,
        addedBy: currentUser.id
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/library', libraryId]);
        },
        error: (err) => {
          this.error.set('Failed to create book');
          this.isSaving.set(false);
        }
      });
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
