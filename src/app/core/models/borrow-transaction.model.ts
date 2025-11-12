/**
 * BorrowTransaction Model
 *
 * Represents the borrowing of a book by a user, tracking the lifecycle
 * from borrow to return.
 *
 * Business Rules:
 * - One book can only be borrowed by one user at a time
 * - Book must be returned to its original library (no transfers)
 * - Status transitions: ACTIVE → RETURNED
 * - Libraries with borrowed books cannot be deleted
 */

export interface BorrowTransaction {
  id: string;                    // Unique identifier
  bookId: string;                // Foreign key to borrowed book
  userId: string;                // Foreign key to borrowing user
  libraryId: string;             // Original library (for return tracking)

  // Status tracking
  status: BorrowStatus;          // Current transaction status
  borrowedAt: Date;              // When book was borrowed
  returnedAt?: Date;             // When book was returned (null if still borrowed)
  dueDate?: Date;                // Optional: When book should be returned

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Borrow transaction status
 */
export enum BorrowStatus {
  ACTIVE = 'ACTIVE',             // Book currently borrowed
  RETURNED = 'RETURNED',         // Book has been returned
  OVERDUE = 'OVERDUE'            // Book is past due date (future enhancement)
}

/**
 * DTO for creating a new borrow transaction
 */
export interface CreateBorrowTransactionDto {
  bookId: string;
  userId: string;
  libraryId: string;
}

/**
 * Extended borrow transaction with book and user details
 * Used for displaying transaction information with related data
 */
export interface BorrowTransactionWithDetails extends BorrowTransaction {
  bookTitle: string;
  bookAuthor: string;
  bookCoverImage?: string;
  userName: string;
  libraryName: string;
}

/**
 * Type guard to check if an object is a valid BorrowTransaction
 */
export function isBorrowTransaction(obj: unknown): obj is BorrowTransaction {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const txn = obj as Record<string, unknown>;
  return (
    typeof txn['id'] === 'string' &&
    typeof txn['bookId'] === 'string' &&
    typeof txn['userId'] === 'string' &&
    typeof txn['libraryId'] === 'string' &&
    Object.values(BorrowStatus).includes(txn['status'] as BorrowStatus) &&
    txn['borrowedAt'] instanceof Date &&
    (txn['returnedAt'] === undefined || txn['returnedAt'] instanceof Date) &&
    (txn['dueDate'] === undefined || txn['dueDate'] instanceof Date) &&
    txn['createdAt'] instanceof Date &&
    txn['updatedAt'] instanceof Date
  );
}
