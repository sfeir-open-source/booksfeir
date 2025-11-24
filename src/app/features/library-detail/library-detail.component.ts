import {Component, computed, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {catchError, EMPTY, filter, forkJoin, map, merge, of, Subject, switchMap, tap} from 'rxjs';
import {LibraryService} from '../../core/services/library.service';
import {BookService} from '../../core/services/book.service';
import {BorrowService} from '../../core/services/borrow.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Library} from '../../core/models/library.model';
import {Book, BookStatus} from '../../core/models/book.model';
import {BorrowTransaction} from '../../core/models/borrow-transaction.model';
import {ConfirmDialogComponent, ConfirmDialogData} from '../shared/dialogs/confirm-dialog/confirm-dialog.component';

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
  styleUrl: './library-detail.component.scss'
})
export class LibraryDetailComponent {
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
  borrowTransactions = signal<Map<string, BorrowTransaction>>(new Map());
  error = signal<string | null>(null);
  isLoading = signal(true);
  isDeleting = signal(false);
  isDeletingBook = signal<string | null>(null);
  isBorrowingBook = signal<string | null>(null);
  isReturningBook = signal<string | null>(null);

  rigthOfManage = computed(() => this.authService.rigthOfManage())

  // Subjects for user actions (Command Pattern)
  private deleteLibraryTrigger$ = new Subject<Library>();
  private deleteBookTrigger$ = new Subject<Book>();
  private borrowBookTrigger$ = new Subject<Book>();
  private returnBookTrigger$ = new Subject<{ book: Book; transaction: BorrowTransaction }>();

  // Reactive data loading using route params → observable → signal pattern
  private libraryId$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    filter((id): id is string => id !== null)
  );

  // Main data stream: library + books + transactions (uses RxJS operators instead of nested subscribes)
  private libraryData$ = this.libraryId$.pipe(
    tap(() => {
      this.isLoading.set(true);
      this.error.set(null);
    }),
    switchMap(libraryId =>
      this.libraryService.getById(libraryId).pipe(
        switchMap(library => {
          if (!library) {
            return of({library: null, books: [], transactions: new Map(), error: 'Library not found'});
          }

          // Load books for this library
          return this.bookService.getByLibrary(libraryId).pipe(
            switchMap(books => {
              const borrowedBooks = books.filter(b => b.status === BookStatus.BORROWED);

              // Load borrow transactions for borrowed books in parallel using forkJoin
              if (borrowedBooks.length === 0) {
                return of({library, books, transactions: new Map<string, BorrowTransaction>(), error: null});
              }

              const transactionRequests = borrowedBooks.map(book =>
                this.borrowService.getBookBorrowTransaction(book.id).pipe(
                  map(transaction => ({bookId: book.id, transaction})),
                  catchError(() => of({bookId: book.id, transaction: null}))
                )
              );

              return forkJoin(transactionRequests).pipe(
                map(results => {
                  const transactions = new Map<string, BorrowTransaction>();
                  results.forEach(({bookId, transaction}) => {
                    if (transaction) {
                      transactions.set(bookId, transaction);
                    }
                  });
                  return {library, books, transactions, error: null};
                })
              );
            }),
            catchError(() => of({library, books: [], transactions: new Map(), error: 'Failed to load books'}))
          );
        }),
        catchError(() => of({library: null, books: [], transactions: new Map(), error: 'Failed to load library'}))
      )
    ),
    tap(data => {
      // Update signals with loaded data
      this.library.set(data.library);
      this.books.set(data.books);
      this.borrowTransactions.set(data.transactions);
      this.error.set(data.error);
      this.isLoading.set(false);
    }),
    catchError(() => {
      this.error.set('Failed to load data');
      this.isLoading.set(false);
      return of({library: null, books: [], transactions: new Map(), error: 'Failed to load data'});
    })
  );

  // Subscribe to data stream using toSignal (automatic subscription management)
  private libraryDataSignal = toSignal(this.libraryData$);

  // Reactive streams for delete library action
  private deleteLibraryResult$ = this.deleteLibraryTrigger$.pipe(
    tap(() => {
      this.isDeleting.set(true);
      this.error.set(null);
    }),
    switchMap(library =>
      this.libraryService.canDelete(library.id).pipe(
        switchMap(canDelete => {
          if (!canDelete) {
            this.showDeleteBlockedDialog();
            return EMPTY;
          }

          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
              title: 'Delete Library',
              message: `Are you sure you want to delete "${library.name}"? This action cannot be undone.`,
              confirmText: 'Delete',
              cancelText: 'Cancel'
            } as ConfirmDialogData
          });

          return dialogRef.afterClosed().pipe(
            switchMap(confirmed => confirmed ? this.libraryService.delete(library.id) : EMPTY),
            tap(() => {
              this.isDeleting.set(false);
              this.router.navigate(['/']);
            }),
            catchError(err => {
              this.error.set('Failed to delete library');
              this.isDeleting.set(false);
              return EMPTY;
            })
          );
        }),
        catchError(err => {
          this.error.set('Failed to check if library can be deleted');
          this.isDeleting.set(false);
          return EMPTY;
        })
      )
    )
  );

  // Reactive stream for delete book action
  private deleteBookResult$ = this.deleteBookTrigger$.pipe(
    tap(book => {
      this.isDeletingBook.set(book.id);
      this.error.set(null);
    }),
    switchMap(book => {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Book',
          message: `Are you sure you want to delete "${book.title}" by ${book.author}? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel'
        } as ConfirmDialogData
      });

      return dialogRef.afterClosed().pipe(
        switchMap(confirmed => {
          if (!confirmed) {
            this.isDeletingBook.set(null);
            return EMPTY;
          }

          return this.bookService.delete(book.id).pipe(
            switchMap(() => {
              const libraryId = this.library()?.id;
              if (!libraryId) {
                this.isDeletingBook.set(null);
                return EMPTY;
              }

              return this.bookService.getByLibrary(libraryId).pipe(
                tap(books => {
                  this.books.set(books);
                  this.isDeletingBook.set(null);
                })
              );
            }),
            catchError(err => {
              this.error.set('Failed to delete book');
              this.isDeletingBook.set(null);
              return EMPTY;
            })
          );
        })
      );
    })
  );

  // Reactive stream for borrow book action
  private borrowBookResult$ = this.borrowBookTrigger$.pipe(
    tap(book => {
      this.isBorrowingBook.set(book.id);
      this.error.set(null);
    }),
    switchMap(book => {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.error.set('You must be logged in to borrow a book');
        this.isBorrowingBook.set(null);
        return EMPTY;
      }

      return this.borrowService.borrowBook({
        bookId: book.id,
        userId: currentUser.id,
        libraryId: book.libraryId
      }).pipe(
        tap(transaction => {
          const updatedBooks = this.books().map(b =>
            b.id === book.id ? {...b, status: BookStatus.BORROWED} : b
          );
          this.books.set(updatedBooks);

          const newMap = new Map(this.borrowTransactions());
          newMap.set(book.id, transaction);
          this.borrowTransactions.set(newMap);

          this.isBorrowingBook.set(null);
          this.showBorrowSuccessDialog(book);
        }),
        catchError(err => {
          this.error.set(err.message || 'Failed to borrow book');
          this.isBorrowingBook.set(null);
          return EMPTY;
        })
      );
    })
  );

  // Reactive stream for return book action
  private returnBookResult$ = this.returnBookTrigger$.pipe(
    switchMap(({book, transaction}) => {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Return Book',
          message: `Are you sure you want to return "${book.title}"?`,
          confirmText: 'Return',
          cancelText: 'Cancel'
        } as ConfirmDialogData
      });

      return dialogRef.afterClosed().pipe(
        switchMap(confirmed => {
          if (!confirmed) return EMPTY;

          this.isReturningBook.set(book.id);
          this.error.set(null);

          return this.borrowService.returnBook(transaction.id).pipe(
            tap(() => {
              const updatedBooks = this.books().map(b =>
                b.id === book.id ? {...b, status: BookStatus.AVAILABLE} : b
              );
              this.books.set(updatedBooks);

              const newMap = new Map(this.borrowTransactions());
              newMap.delete(book.id);
              this.borrowTransactions.set(newMap);

              this.isReturningBook.set(null);
              this.showReturnSuccessDialog(book);
            }),
            catchError(err => {
              this.error.set('Failed to return book');
              this.isReturningBook.set(null);
              return EMPTY;
            })
          );
        })
      );
    })
  );

  // Merge all action streams and subscribe with toSignal
  private allActions$ = merge(
    this.deleteLibraryResult$,
    this.deleteBookResult$,
    this.borrowBookResult$,
    this.returnBookResult$
  );

  private actionsSignal = toSignal(this.allActions$);

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
   * Delete library - trigger reactive stream
   */
  onDelete(): void {
    const library = this.library();
    if (!library) return;

    this.deleteLibraryTrigger$.next(library);
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
   * Delete book - trigger reactive stream
   */
  onDeleteBook(book: Book): void {
    // Check if book can be deleted (not currently borrowed)
    if (book.status === 'BORROWED') {
      this.showDeleteBookBlockedDialog(book);
      return;
    }

    this.deleteBookTrigger$.next(book);
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
   * Borrow a book - trigger reactive stream
   */
  onBorrowBook(book: Book): void {
    this.borrowBookTrigger$.next(book);
  }

  /**
   * Return a borrowed book - trigger reactive stream
   */
  onReturnBook(book: Book): void {
    const transaction = this.borrowTransactions().get(book.id);
    if (!transaction) {
      this.error.set('No active borrow transaction found for this book');
      return;
    }

    this.returnBookTrigger$.next({book, transaction});
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
