/**
 * Borrow Service Contract
 *
 * Defines the interface for book borrowing and returning operations.
 * Implementations: DatastoreMockService (dev), DatastoreGcpService (prod)
 */

import { Observable } from 'rxjs';
import { BorrowTransaction, BorrowStatus } from '../data-model';

export interface BorrowService {
  /**
   * Borrow a book
   *
   * Business Rules:
   * - Book must have status=AVAILABLE
   * - Creates BorrowTransaction with status=ACTIVE
   * - Updates book status to BORROWED
   *
   * @param bookId - Book unique identifier
   * @param userId - User unique identifier (from auth context)
   * @param libraryId - Original library ID (for return tracking)
   * @returns Observable of created borrow transaction
   * @emits Created BorrowTransaction with id, timestamps, status=ACTIVE
   * @errors Throws if book not available, not found, or already borrowed
   * @errorMessage "Book is not available for borrowing" if status != AVAILABLE
   */
  borrowBook(bookId: string, userId: string, libraryId: string): Observable<BorrowTransaction>;

  /**
   * Return a borrowed book
   *
   * Business Rules:
   * - Must have active borrow transaction for this book
   * - Updates transaction status to RETURNED, sets returnedAt timestamp
   * - Updates book status to AVAILABLE
   *
   * @param transactionId - BorrowTransaction unique identifier
   * @returns Observable of updated transaction
   * @emits Updated BorrowTransaction with returnedAt set, status=RETURNED
   * @errors Throws if transaction not found or already returned
   * @errorMessage "Transaction not found or already returned"
   */
  returnBook(transactionId: string): Observable<BorrowTransaction>;

  /**
   * Get all active borrows for a user
   *
   * @param userId - User unique identifier
   * @returns Observable of active borrow transactions
   * @emits Array of BorrowTransaction objects with status=ACTIVE, sorted by borrowedAt desc
   * @errors Never throws (returns empty array on error)
   */
  getActiveByUser(userId: string): Observable<BorrowTransaction[]>;

  /**
   * Get all borrow transactions for a book (history)
   *
   * @param bookId - Book unique identifier
   * @returns Observable of all borrow transactions for the book
   * @emits Array of BorrowTransaction objects, sorted by borrowedAt desc
   * @errors Never throws (returns empty array on error)
   */
  getHistoryByBook(bookId: string): Observable<BorrowTransaction[]>;

  /**
   * Get active borrow transaction for a book (if any)
   *
   * @param bookId - Book unique identifier
   * @returns Observable of active transaction or null
   * @emits BorrowTransaction with status=ACTIVE or null if not borrowed
   * @errors Never throws (returns null on error)
   */
  getActiveByBook(bookId: string): Observable<BorrowTransaction | null>;

  /**
   * Check if a book is currently borrowed
   *
   * @param bookId - Book unique identifier
   * @returns Observable of boolean
   * @emits true if book has active borrow transaction, false otherwise
   * @errors Never throws (returns false on error)
   */
  isBookBorrowed(bookId: string): Observable<boolean>;

  /**
   * Get count of borrowed books in a library
   *
   * Used to prevent library deletion (FR-017)
   *
   * @param libraryId - Library unique identifier
   * @returns Observable of count
   * @emits Number of books currently borrowed from this library
   * @errors Never throws (returns 0 on error)
   */
  countBorrowedInLibrary(libraryId: string): Observable<number>;
}