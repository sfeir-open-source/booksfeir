import {Component, computed, effect, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {BorrowService} from '../../core/services/borrow.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {BorrowStatus, BorrowTransactionWithDetails} from '../../core/models/borrow-transaction.model';
import {ConfirmDialogComponent, ConfirmDialogData} from '../shared/dialogs/confirm-dialog/confirm-dialog.component';
import {catchError, combineLatest, filter, map, of, switchMap, tap} from 'rxjs';

/**
 * BorrowedBooksComponent
 *
 * Displays a list of books borrowed by the current user.
 *
 * Features:
 * - List of borrowed books with due dates
 * - Overdue warnings
 * - Return functionality
 * - Empty state when no books are borrowed
 * - OnPush change detection with signals
 */
@Component({
  selector: 'sfeir-borrowed-books',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './borrowed-books.html',
  styleUrl: './borrowed-books.scss'
})
export class BorrowedBooksComponent {
  private router = inject(Router);
  private borrowService = inject(BorrowService);
  private authService = inject(AuthMockService);
  private dialog = inject(MatDialog);

  // Reactive state with signals
  private currentUser = this.authService.currentUser;
  isReturningBook = signal<string | null>(null); // Track which book is being returned
  private refreshTrigger = signal(0); // Trigger for manual refresh after mutations
  private returnBookTrigger = signal<BorrowTransactionWithDetails | null>(null); // Trigger for return operation

  // Convert signals to observables at field level (injection context)
  private currentUser$ = toObservable(this.currentUser);
  private refreshTrigger$ = toObservable(this.refreshTrigger);
  private returnBookTrigger$ = toObservable(this.returnBookTrigger);

  // Load borrowed books using toSignal with observable conversion
  private allTransactions = toSignal(
    combineLatest([this.currentUser$, this.refreshTrigger$]).pipe(
      switchMap(([user, _]) => {
        if (!user) {
          return of({data: [], error: 'You must be logged in to view borrowed books'});
        }
        return this.borrowService.getUserBorrowsWithDetails(user.id).pipe(
          map(transactions => ({data: transactions, error: null})),
          catchError(() => of({data: [], error: 'Failed to load borrowed books'})),
          tap(() => this.isLoaded.set(true))
        );
      })
    ),
    {initialValue: {data: [], error: null}}
  );

  // Handle return book operation with signals
  private returnResult = toSignal(
    this.returnBookTrigger$.pipe(
      filter(transaction => transaction !== null),
      tap(transaction => this.isReturningBook.set(transaction!.id)),
      switchMap(transaction =>
        this.borrowService.returnBook(transaction!.id).pipe(
          map(() => ({success: true, transaction: transaction!, error: null})),
          catchError(() => of({success: false, transaction: transaction!, error: 'Failed to return book'}))
        )
      )
    ),
    {initialValue: {success: false, transaction: {} as BorrowTransactionWithDetails, error: null}}
  );

  // Computed signals for derived state
  borrowedBooks = computed(() => {
    const transactions = this.allTransactions()?.data || [];
    return transactions.filter(t => t.status === BorrowStatus.ACTIVE);
  });

  error = computed(() => this.allTransactions()?.error || null);
  isLoaded = signal(false);
  isLoading = computed(() => !this.isLoaded());

  constructor() {
    // Effect to handle post-return actions
    effect(() => {
      const result = this.returnResult();
      if (result?.success && result.transaction) {
        // Trigger refresh to reload borrowed books
        this.refreshTrigger.update(v => v + 1);
        this.isReturningBook.set(null);
        this.showReturnSuccessDialog(result.transaction);
        // Reset trigger
        this.returnBookTrigger.set(null);
      } else if (result?.error) {
        this.isReturningBook.set(null);
        // Reset trigger
        this.returnBookTrigger.set(null);
      }
    });
  }

  /**
   * Navigate back to homepage
   */
  goBack(): void {
    this.router.navigate(['/']);
  }

  /**
   * Return a borrowed book
   */
  onReturnBook(transaction: BorrowTransactionWithDetails): void {
    this.showReturnConfirmDialog(transaction);
  }

  /**
   * Show return confirmation dialog and handle result
   */
  private showReturnConfirmDialog(transaction: BorrowTransactionWithDetails): void {
    const dialogData: ConfirmDialogData = {
      title: 'Return Book',
      message: `Are you sure you want to return "${transaction.bookTitle}"?`,
      confirmText: 'Return',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    // Subscribe to dialog result directly
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed === true) {
        // Trigger the return operation
        this.returnBookTrigger.set(transaction);
      }
    });
  }

  /**
   * Show return success dialog
   */
  private showReturnSuccessDialog(transaction: BorrowTransactionWithDetails): void {
    const dialogData: ConfirmDialogData = {
      title: 'Book Returned Successfully',
      message: `Thank you for returning "${transaction.bookTitle}". The book is now available for others to borrow.`,
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  /**
   * Check if a book is overdue
   */
  isOverdue(transaction: BorrowTransactionWithDetails): boolean {
    return this.borrowService.isOverdue(transaction);
  }

  /**
   * Get days remaining for a transaction
   */
  getDaysRemaining(transaction: BorrowTransactionWithDetails): number | null {
    return this.borrowService.getDaysRemaining(transaction);
  }

  /**
   * Get status color for chip
   */
  getStatusColor(transaction: BorrowTransactionWithDetails): 'primary' | 'accent' | 'warn' {
    if (this.isOverdue(transaction)) {
      return 'warn';
    }
    const daysRemaining = this.getDaysRemaining(transaction);
    if (daysRemaining !== null && daysRemaining <= 3) {
      return 'accent';
    }
    return 'primary';
  }

  /**
   * Get status text
   */
  getStatusText(transaction: BorrowTransactionWithDetails): string {
    if (this.isOverdue(transaction)) {
      const daysRemaining = this.getDaysRemaining(transaction);
      return `Overdue by ${Math.abs(daysRemaining || 0)} days`;
    }
    const daysRemaining = this.getDaysRemaining(transaction);
    if (daysRemaining === null) {
      return 'No due date';
    }
    if (daysRemaining === 0) {
      return 'Due today';
    }
    if (daysRemaining === 1) {
      return 'Due tomorrow';
    }
    return `${daysRemaining} days remaining`;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Track by function for @for loop optimization
   */
  trackByTransactionId(_index: number, transaction: BorrowTransactionWithDetails): string {
    return transaction.id;
  }
}
