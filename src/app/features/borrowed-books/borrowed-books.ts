import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BorrowService } from '../../core/services/borrow.service';
import { AuthMockService } from '../../core/services/mock/auth-mock.service';
import { BorrowTransactionWithDetails, BorrowStatus } from '../../core/models/borrow-transaction.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/dialogs/confirm-dialog/confirm-dialog.component';

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
  standalone: true,
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
  styleUrl: './borrowed-books.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BorrowedBooksComponent implements OnInit {
  private router = inject(Router);
  private borrowService = inject(BorrowService);
  private authService = inject(AuthMockService);
  private dialog = inject(MatDialog);

  // Signals for reactive state
  borrowedBooks = signal<BorrowTransactionWithDetails[]>([]);
  isLoading = signal(true);
  isReturningBook = signal<string | null>(null); // Track which book is being returned
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadBorrowedBooks();
  }

  private loadBorrowedBooks(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('You must be logged in to view borrowed books');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.borrowService.getUserBorrowsWithDetails(currentUser.id).subscribe({
      next: (transactions) => {
        // Filter only active borrows
        const activeBooks = transactions.filter(t => t.status === BorrowStatus.ACTIVE);
        this.borrowedBooks.set(activeBooks);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load borrowed books');
        this.isLoading.set(false);
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
   * Show return confirmation dialog
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

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeReturn(transaction);
      }
    });
  }

  /**
   * Execute book return
   */
  private executeReturn(transaction: BorrowTransactionWithDetails): void {
    this.isReturningBook.set(transaction.id);
    this.error.set(null);

    this.borrowService.returnBook(transaction.id).subscribe({
      next: () => {
        // Remove the returned book from the list
        const updated = this.borrowedBooks().filter(b => b.id !== transaction.id);
        this.borrowedBooks.set(updated);
        this.isReturningBook.set(null);
        this.showReturnSuccessDialog(transaction);
      },
      error: (err) => {
        this.error.set('Failed to return book');
        this.isReturningBook.set(null);
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
  trackByTransactionId(index: number, transaction: BorrowTransactionWithDetails): string {
    return transaction.id;
  }
}
