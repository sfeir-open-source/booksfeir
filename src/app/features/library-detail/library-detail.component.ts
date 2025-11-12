import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LibraryService } from '../../core/services/library.service';
import { BookService } from '../../core/services/book.service';
import { BorrowService } from '../../core/services/borrow.service';
import { AuthMockService } from '../../core/services/mock/auth-mock.service';
import { Library } from '../../core/models/library.model';
import { Book, BookStatus } from '../../core/models/book.model';
import { BorrowTransaction } from '../../core/models/borrow-transaction.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/dialogs/confirm-dialog/confirm-dialog.component';

/**
 * LibraryDetailComponent
 *
 * Displays a single library with its collection of books.
 *
 * Features:
 * - Library information header (name, description, location)
 * - List of books in the library
 * - Book status indicators (available/borrowed)
 * - Empty state when no books exist
 * - Back navigation to homepage
 * - OnPush change detection with signals
 */
@Component({
  selector: 'sfeir-library-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './library-detail.component.html',
  styleUrl: './library-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private libraryService = inject(LibraryService);
  private bookService = inject(BookService);
  private borrowService = inject(BorrowService);
  private authService = inject(AuthMockService);
  private dialog = inject(MatDialog);

  // Signals for reactive state
  library = signal<Library | null>(null);
  books = signal<Book[]>([]);
  isLoading = signal(true);
  isDeleting = signal(false);
  isDeletingBook = signal<string | null>(null); // Track which book is being deleted
  isBorrowingBook = signal<string | null>(null); // Track which book is being borrowed
  isReturningBook = signal<string | null>(null); // Track which book is being returned
  borrowTransactions = signal<Map<string, BorrowTransaction>>(new Map()); // Map bookId -> transaction
  error = signal<string | null>(null);

  ngOnInit(): void {
    const libraryId = this.route.snapshot.paramMap.get('id');

    if (!libraryId) {
      this.error.set('Library ID is missing');
      this.isLoading.set(false);
      return;
    }

    this.loadLibraryAndBooks(libraryId);
  }

  private loadLibraryAndBooks(libraryId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load library details
    this.libraryService.getById(libraryId).subscribe({
      next: (library) => {
        if (!library) {
          this.error.set('Library not found');
          this.isLoading.set(false);
          return;
        }

        this.library.set(library);

        // Load books for this library
        this.bookService.getByLibrary(libraryId).subscribe({
          next: (books) => {
            this.books.set(books);

            // Load borrow transactions for borrowed books
            this.loadBorrowTransactions(books);

            this.isLoading.set(false);
          },
          error: (err) => {
            this.error.set('Failed to load books');
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.error.set('Failed to load library');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load borrow transactions for borrowed books
   */
  private loadBorrowTransactions(books: Book[]): void {
    const borrowedBooks = books.filter(b => b.status === BookStatus.BORROWED);

    if (borrowedBooks.length === 0) {
      return;
    }

    // Load transactions for each borrowed book
    borrowedBooks.forEach(book => {
      this.borrowService.getBookBorrowTransaction(book.id).subscribe({
        next: (transaction) => {
          if (transaction) {
            const newMap = new Map(this.borrowTransactions());
            newMap.set(book.id, transaction);
            this.borrowTransactions.set(newMap);
          }
        },
        error: (err) => {
        }
      });
    });
  }

  /**
   * Navigate back to homepage
   */
  goBack(): void {
    this.router.navigate(['/']);
  }

  /**
   * Track by function for @for loop optimization
   */
  trackByBookId(index: number, book: Book): string {
    return book.id;
  }

  /**
   * Get display text for book status
   */
  getStatusDisplay(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  /**
   * Get color for status chip
   */
  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'AVAILABLE':
        return 'primary';
      case 'BORROWED':
        return 'accent';
      case 'UNAVAILABLE':
        return 'warn';
      default:
        return 'primary';
    }
  }

  /**
   * Navigate to edit page
   */
  onEdit(): void {
    const library = this.library();
    if (library) {
      this.router.navigate(['/library', library.id, 'edit']);
    }
  }

  /**
   * Delete library after confirmation
   */
  onDelete(): void {
    const library = this.library();
    if (!library) return;

    // Check if library can be deleted (no borrowed books)
    this.libraryService.canDelete(library.id).subscribe({
      next: (canDelete) => {
        if (!canDelete) {
          this.showDeleteBlockedDialog();
          return;
        }

        this.showDeleteConfirmDialog(library);
      },
      error: (err) => {
        this.error.set('Failed to check if library can be deleted');
      }
    });
  }

  /**
   * Show dialog when library cannot be deleted
   */
  private showDeleteBlockedDialog(): void {
    const dialogData: ConfirmDialogData = {
      title: 'Cannot Delete Library',
      message: 'This library has books that are currently borrowed and cannot be deleted. Please ensure all books are returned first.',
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  /**
   * Show delete confirmation dialog
   */
  private showDeleteConfirmDialog(library: Library): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Library',
      message: `Are you sure you want to delete "${library.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeDelete(library.id);
      }
    });
  }

  /**
   * Execute library deletion
   */
  private executeDelete(libraryId: string): void {
    this.isDeleting.set(true);
    this.error.set(null);

    this.libraryService.delete(libraryId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set('Failed to delete library');
        this.isDeleting.set(false);
      }
    });
  }

  /**
   * Navigate to add book page
   */
  onAddBook(): void {
    const library = this.library();
    if (library) {
      this.router.navigate(['/library', library.id, 'book', 'new']);
    }
  }

  /**
   * Navigate to edit book page
   */
  onEditBook(book: Book): void {
    this.router.navigate(['/library', book.libraryId, 'book', book.id, 'edit']);
  }

  /**
   * Delete book after confirmation
   */
  onDeleteBook(book: Book): void {
    // Check if book can be deleted (not currently borrowed)
    if (book.status === 'BORROWED') {
      this.showDeleteBookBlockedDialog(book);
      return;
    }

    this.showDeleteBookConfirmDialog(book);
  }

  /**
   * Show dialog when book cannot be deleted
   */
  private showDeleteBookBlockedDialog(book: Book): void {
    const dialogData: ConfirmDialogData = {
      title: 'Cannot Delete Book',
      message: `"${book.title}" is currently borrowed and cannot be deleted. Please wait for it to be returned first.`,
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  /**
   * Show delete book confirmation dialog
   */
  private showDeleteBookConfirmDialog(book: Book): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Book',
      message: `Are you sure you want to delete "${book.title}" by ${book.author}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeBookDelete(book);
      }
    });
  }

  /**
   * Execute book deletion
   */
  private executeBookDelete(book: Book): void {
    this.isDeletingBook.set(book.id);
    this.error.set(null);

    this.bookService.delete(book.id).subscribe({
      next: () => {
        // Refresh the books list
        const libraryId = this.library()?.id;
        if (libraryId) {
          this.bookService.getByLibrary(libraryId).subscribe({
            next: (books) => {
              this.books.set(books);
              this.isDeletingBook.set(null);
            }
          });
        } else {
          this.isDeletingBook.set(null);
        }
      },
      error: (err) => {
        this.error.set('Failed to delete book');
        this.isDeletingBook.set(null);
      }
    });
  }

  /**
   * Borrow a book
   */
  onBorrowBook(book: Book): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.error.set('You must be logged in to borrow a book');
      return;
    }

    this.isBorrowingBook.set(book.id);
    this.error.set(null);

    this.borrowService.borrowBook({
      bookId: book.id,
      userId: currentUser.id,
      libraryId: book.libraryId
    }).subscribe({
      next: (transaction) => {
        // Update book status and borrow transactions
        const updatedBooks = this.books().map(b =>
          b.id === book.id ? { ...b, status: BookStatus.BORROWED } : b
        );
        this.books.set(updatedBooks);

        // Update borrow transactions map
        const newMap = new Map(this.borrowTransactions());
        newMap.set(book.id, transaction);
        this.borrowTransactions.set(newMap);

        this.isBorrowingBook.set(null);
        this.showBorrowSuccessDialog(book);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to borrow book');
        this.isBorrowingBook.set(null);
      }
    });
  }

  /**
   * Return a borrowed book
   */
  onReturnBook(book: Book): void {
    const transaction = this.borrowTransactions().get(book.id);
    if (!transaction) {
      this.error.set('No active borrow transaction found for this book');
      return;
    }

    this.showReturnConfirmDialog(book, transaction);
  }

  /**
   * Show borrow success dialog
   */
  private showBorrowSuccessDialog(book: Book): void {
    const dialogData: ConfirmDialogData = {
      title: 'Book Borrowed Successfully',
      message: `You have successfully borrowed "${book.title}". Please return it within 14 days.`,
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  /**
   * Show return confirmation dialog
   */
  private showReturnConfirmDialog(book: Book, transaction: BorrowTransaction): void {
    const dialogData: ConfirmDialogData = {
      title: 'Return Book',
      message: `Are you sure you want to return "${book.title}"?`,
      confirmText: 'Return',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeReturn(book, transaction);
      }
    });
  }

  /**
   * Execute book return
   */
  private executeReturn(book: Book, transaction: BorrowTransaction): void {
    this.isReturningBook.set(book.id);
    this.error.set(null);

    this.borrowService.returnBook(transaction.id).subscribe({
      next: () => {
        // Update book status
        const updatedBooks = this.books().map(b =>
          b.id === book.id ? { ...b, status: BookStatus.AVAILABLE } : b
        );
        this.books.set(updatedBooks);

        // Remove from borrow transactions map
        const newMap = new Map(this.borrowTransactions());
        newMap.delete(book.id);
        this.borrowTransactions.set(newMap);

        this.isReturningBook.set(null);
        this.showReturnSuccessDialog(book);
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
  private showReturnSuccessDialog(book: Book): void {
    const dialogData: ConfirmDialogData = {
      title: 'Book Returned Successfully',
      message: `Thank you for returning "${book.title}".`,
      confirmText: 'OK',
      cancelText: ''
    };

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });
  }

  /**
   * Check if current user can borrow a book
   */
  canBorrowBook(book: Book): boolean {
    return book.status === BookStatus.AVAILABLE;
  }

  /**
   * Check if current user has borrowed this book
   */
  hasUserBorrowedBook(book: Book): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    const transaction = this.borrowTransactions().get(book.id);
    return transaction !== undefined && transaction.userId === currentUser.id;
  }
}
