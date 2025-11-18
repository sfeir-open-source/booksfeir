import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, of, map, forkJoin, switchMap, throwError } from 'rxjs';
import {
  BorrowTransaction,
  BorrowStatus,
  CreateBorrowTransactionDto,
  BorrowTransactionWithDetails
} from '../models/borrow-transaction.model';
import { BookStatus } from '../models/book.model';
import { DatastoreMockService } from './mock/datastore-mock.service';
import { BookService } from './book.service';
import { LibraryService } from './library.service';
import { AuthMockService } from './mock/auth-mock.service';

/**
 * BorrowService
 *
 * Manages book borrowing and returning operations with business rules enforcement.
 *
 * Business Rules:
 * - One book can only be borrowed by one user at a time
 * - A user can borrow up to 3 books simultaneously
 * - Book must be returned to its original library
 * - Book status updates automatically (AVAILABLE <-> BORROWED)
 * - Borrowed books have a 14-day due date
 */
@Injectable({
  providedIn: 'root'
})
export class BorrowService {
  private datastore = inject(DatastoreMockService);
  private bookService = inject(BookService);
  private libraryService = inject(LibraryService);
  private auth = inject(AuthMockService);

  // Maximum number of books a user can borrow simultaneously
  private readonly MAX_BORROWED_BOOKS = 3;

  // Private writable signal for active borrows cache
  private borrowsSignal = signal<BorrowTransaction[]>([]);

  // Public readonly signal
  borrows = this.borrowsSignal.asReadonly();

  /**
   * Get all active borrow transactions for a user
   *
   * @param userId - User unique identifier
   * @returns Observable of active borrow transactions
   */
  getUserBorrows(userId: string): Observable<BorrowTransaction[]> {
    return this.datastore.query<BorrowTransaction>('BorrowTransaction',
      (txn: BorrowTransaction) => txn.userId === userId && txn.status === BorrowStatus.ACTIVE
    ).pipe(
      tap(borrows => this.borrowsSignal.set(borrows)),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Get all active and returned borrow transactions for a user with book details
   *
   * @param userId - User unique identifier
   * @returns Observable of borrow transactions with details
   */
  getUserBorrowsWithDetails(userId: string): Observable<BorrowTransactionWithDetails[]> {
    return this.datastore.query<BorrowTransaction>('BorrowTransaction',
      (txn: BorrowTransaction) => txn.userId === userId
    ).pipe(
      switchMap(transactions => {
        if (transactions.length === 0) {
          return of([]);
        }

        // Get details for each transaction
        const detailRequests = transactions.map(txn =>
          forkJoin({
            transaction: of(txn),
            book: this.bookService.getById(txn.bookId),
            library: this.libraryService.getById(txn.libraryId)
          })
        );

        return forkJoin(detailRequests).pipe(
          map(results => {
            return results
              .filter(r => r.book !== null && r.library !== null)
              .map(r => ({
                ...r.transaction,
                bookTitle: r.book!.title,
                bookAuthor: r.book!.author,
                bookCoverImage: r.book!.coverImage,
                userName: this.auth.currentUser()?.name || 'Unknown User',
                libraryName: r.library!.name
              }));
          })
        );
      }),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Check if a book is currently borrowed
   *
   * @param bookId - Book unique identifier
   * @returns Observable of active borrow transaction or null
   */
  getBookBorrowTransaction(bookId: string): Observable<BorrowTransaction | null> {
    return this.datastore.query<BorrowTransaction>('BorrowTransaction',
      (txn: BorrowTransaction) => txn.bookId === bookId && txn.status === BorrowStatus.ACTIVE
    ).pipe(
      map(transactions => transactions.length > 0 ? transactions[0] : null),
      catchError(err => {
        return of(null);
      })
    );
  }

  /**
   * Check if a user can borrow a book (business rules validation)
   *
   * @param userId - User unique identifier
   * @param bookId - Book unique identifier
   * @returns Observable with validation result and error message if any
   */
  checkCanBorrow(userId: string, bookId: string): Observable<{ canBorrow: boolean; reason?: string }> {
    return forkJoin({
      userBorrows: this.getUserBorrows(userId),
      bookBorrow: this.getBookBorrowTransaction(bookId),
      book: this.bookService.getById(bookId)
    }).pipe(
      map(({ userBorrows, bookBorrow, book }) => {
        // Check if user has reached the maximum number of borrowed books
        if (userBorrows.length >= this.MAX_BORROWED_BOOKS) {
          return {
            canBorrow: false,
            reason: `You have already borrowed ${this.MAX_BORROWED_BOOKS} books. Please return at least one before borrowing another.`
          };
        }

        // Check if book is already borrowed
        if (bookBorrow !== null) {
          return {
            canBorrow: false,
            reason: 'This book is currently borrowed by another user.'
          };
        }

        // Check if book exists and is available
        if (!book) {
          return {
            canBorrow: false,
            reason: 'Book not found.'
          };
        }

        if (book.status !== BookStatus.AVAILABLE) {
          return {
            canBorrow: false,
            reason: 'This book is not available for borrowing.'
          };
        }

        return { canBorrow: true };
      }),
      catchError(err => {
        return of({ canBorrow: false, reason: 'An error occurred while checking borrow eligibility.' });
      })
    );
  }

  /**
   * Borrow a book
   *
   * Creates a borrow transaction and updates book status
   *
   * @param dto - Borrow transaction data
   * @returns Observable of created borrow transaction
   */
  borrowBook(dto: CreateBorrowTransactionDto): Observable<BorrowTransaction> {
    // First check if user can borrow
    return this.checkCanBorrow(dto.userId, dto.bookId).pipe(
      switchMap(validation => {
        if (!validation.canBorrow) {
          return throwError(() => new Error(validation.reason));
        }

        // Calculate due date (14 days from now)
        const borrowedAt = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const transaction: Omit<BorrowTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
          bookId: dto.bookId,
          userId: dto.userId,
          libraryId: dto.libraryId,
          status: BorrowStatus.ACTIVE,
          borrowedAt,
          dueDate
        };

        // Create transaction and update book status
        return this.datastore.create<BorrowTransaction>('BorrowTransaction', transaction).pipe(
          switchMap(created => {
            // Update book status to BORROWED
            return this.bookService.updateStatus(dto.bookId, BookStatus.BORROWED).pipe(
              map(() => created)
            );
          }),
          tap(created => {
            // Update local cache
            const current = this.borrowsSignal();
            this.borrowsSignal.set([...current, created]);
          }),
          catchError(err => {
            throw err;
          })
        );
      })
    );
  }

  /**
   * Return a borrowed book
   *
   * Updates transaction status and book availability
   *
   * @param transactionId - Borrow transaction unique identifier
   * @returns Observable of updated transaction
   */
  returnBook(transactionId: string): Observable<BorrowTransaction> {
    // First get the transaction to get the book ID
    return this.datastore.read<BorrowTransaction>('BorrowTransaction', transactionId).pipe(
      switchMap(transaction => {
        if (!transaction) {
          return throwError(() => new Error('Transaction not found'));
        }

        if (transaction.status !== BorrowStatus.ACTIVE) {
          return throwError(() => new Error('This book has already been returned'));
        }

        const returnedAt = new Date();

        // Update transaction status
        return this.datastore.update<BorrowTransaction>('BorrowTransaction', transactionId, {
          status: BorrowStatus.RETURNED,
          returnedAt
        }).pipe(
          switchMap(updated => {
            // Update book status back to AVAILABLE
            return this.bookService.updateStatus(transaction.bookId, BookStatus.AVAILABLE).pipe(
              map(() => updated)
            );
          }),
          tap(updated => {
            // Update local cache
            const current = this.borrowsSignal();
            this.borrowsSignal.set(current.filter(b => b.id !== transactionId));
          }),
          catchError(err => {
            throw err;
          })
        );
      })
    );
  }

  /**
   * Check if a book is overdue
   *
   * @param transaction - Borrow transaction
   * @returns True if book is overdue
   */
  isOverdue(transaction: BorrowTransaction): boolean {
    if (transaction.status !== BorrowStatus.ACTIVE || !transaction.dueDate) {
      return false;
    }
    return new Date() > transaction.dueDate;
  }

  /**
   * Get days remaining until due date
   *
   * @param transaction - Borrow transaction
   * @returns Days remaining (negative if overdue)
   */
  getDaysRemaining(transaction: BorrowTransaction): number | null {
    if (!transaction.dueDate) {
      return null;
    }
    const now = new Date();
    const diffTime = transaction.dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
