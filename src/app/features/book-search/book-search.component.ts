import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from '@angular/material/select';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatChipsModule} from '@angular/material/chips';
import {catchError, of, startWith, Subject, switchMap, tap} from 'rxjs';
import {GoogleBookResult, GoogleBooksService} from '../../core/services/google-books.service';
import {PurchaseRequestService} from '../../core/services/purchase-request.service';
import {LibraryService} from '../../core/services/library.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Library} from '../../core/models/library.model';
import {ConfirmDialogComponent, ConfirmDialogData} from '../shared/dialogs/confirm-dialog/confirm-dialog.component';

/**
 * BookSearchComponent
 *
 * Allows users to search for books using Google Books API
 * and submit purchase requests for books not in the system.
 *
 * Features:
 * - Search Google Books API
 * - Display search results with cover images
 * - Select target library for purchase request
 * - Submit purchase requests
 * - Prevent duplicate requests
 * - Loading and error states
 */
@Component({
  selector: 'sfeir-book-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './book-search.component.html',
  styleUrl: './book-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookSearchComponent {
  private fb = inject(FormBuilder);
  private googleBooksService = inject(GoogleBooksService);
  private purchaseRequestService = inject(PurchaseRequestService);
  private libraryService = inject(LibraryService);
  private authService = inject(AuthMockService);
  private dialog = inject(MatDialog);

  searchForm!: FormGroup;
  searchResults = signal<GoogleBookResult[]>([]);
  searchPerformed = signal(false);
  error = signal<string | null>(null);

  // Subjects for reactive actions
  private loadLibrariesTrigger$ = new Subject<void>();
  private searchTrigger$ = new Subject<string>();
  private purchaseRequestTrigger$ = new Subject<{ book: GoogleBookResult; libraryId: string; userId: string }>();

  // Observable streams
  private libraries$ = this.loadLibrariesTrigger$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.libraryService.getAll().pipe(
        tap(libraries => {
          if (libraries.length === 1) {
            this.searchForm.patchValue({libraryId: libraries[0].id});
          }
        }),
        catchError(error => {
          this.error.set('Failed to load libraries');
          return of([] as Library[]);
        })
      )
    )
  );

  private searchResults$ = this.searchTrigger$.pipe(
    tap(() => {
      this.searchPerformed.set(true);
      this.error.set(null);
    }),
    switchMap(query =>
      this.googleBooksService.search(query, 20).pipe(
        tap(results => this.searchResults.set(results)),
        catchError(error => {
          this.error.set('Failed to search books. Please try again.');
          this.searchResults.set([]);
          return of([] as GoogleBookResult[]);
        })
      )
    )
  );

  private purchaseRequest$ = this.purchaseRequestTrigger$.pipe(
    switchMap(({book, libraryId, userId}) =>
      this.purchaseRequestService.create({
        userId,
        libraryId,
        title: book.title,
        author: book.author,
        edition: book.publisher,
        publicationDate: book.publicationDate,
        isbn: book.isbn,
        coverImage: book.coverImage,
        googleBooksId: book.googleBooksId
      }).pipe(
        tap(() => this.showSuccessDialog(book)),
        catchError(error => {
          this.error.set('Failed to submit purchase request');
          return of(undefined);
        })
      )
    )
  );

  // Convert to signals
  libraries = toSignal(this.libraries$, {initialValue: [] as Library[]});
  private searchStatus = toSignal(this.searchResults$);
  private purchaseStatus = toSignal(this.purchaseRequest$);

  // Computed states
  isSearching = signal(false);
  isSubmitting = signal<string | null>(null);

  constructor() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      query: ['', [Validators.required, Validators.minLength(2)]],
      libraryId: ['', [Validators.required]]
    });
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const query = this.searchForm.get('query')?.value;
    this.isSearching.set(true);
    this.searchTrigger$.next(query);
    // Reset loading after a delay to show spinner
    setTimeout(() => this.isSearching.set(false), 500);
  }

  onRequestPurchase(book: GoogleBookResult): void {
    const libraryId = this.searchForm.get('libraryId')?.value;
    const currentUser = this.authService.currentUser();

    if (!libraryId) {
      this.error.set('Please select a library first');
      return;
    }

    if (!currentUser) {
      this.error.set('You must be logged in to request a purchase');
      return;
    }

    // For duplicate check, we'll use a simpler approach with toSignal
    if (book.googleBooksId) {
      this.isSubmitting.set(book.googleBooksId);
      this.error.set(null);

      const duplicateCheck$ = this.purchaseRequestService.checkDuplicate(book.googleBooksId, libraryId).pipe(
        tap(isDuplicate => {
          if (isDuplicate) {
            this.showDuplicateDialog(book);
            this.isSubmitting.set(null);
          } else {
            this.purchaseRequestTrigger$.next({book, libraryId, userId: currentUser.id});
            setTimeout(() => this.isSubmitting.set(null), 500);
          }
        }),
        catchError(() => {
          // Proceed with request even if check fails
          this.purchaseRequestTrigger$.next({book, libraryId, userId: currentUser.id});
          setTimeout(() => this.isSubmitting.set(null), 500);
          return of(false);
        })
      );

      toSignal(duplicateCheck$);
    } else {
      this.isSubmitting.set(book.googleBooksId);
      this.purchaseRequestTrigger$.next({book, libraryId, userId: currentUser.id});
      setTimeout(() => this.isSubmitting.set(null), 500);
    }
  }

  private showDuplicateDialog(book: GoogleBookResult): void {
    const dialogData: ConfirmDialogData = {
      title: 'Request Already Exists',
      message: `A purchase request for "${book.title}" already exists for this library. You cannot submit duplicate requests.`,
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  private showSuccessDialog(book: GoogleBookResult): void {
    const dialogData: ConfirmDialogData = {
      title: 'Purchase Request Submitted',
      message: `Your request for "${book.title}" has been submitted successfully. An administrator will review it soon.`,
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.searchForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      query: 'Search query',
      libraryId: 'Library'
    };
    return labels[fieldName] || fieldName;
  }

  hasError(fieldName: string): boolean {
    const control = this.searchForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  trackByGoogleBooksId(index: number, book: GoogleBookResult): string {
    return book.googleBooksId;
  }
}
