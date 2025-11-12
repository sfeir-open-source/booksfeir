/**
 * Book Model
 *
 * Represents a physical or digital book that belongs to a library.
 *
 * Business Rules:
 * - title and author are required (C-002)
 * - edition, publicationDate, isbn, coverImage are optional (C-002)
 * - Multiple copies of same book allowed (duplicates represent physical copies)
 * - Status transitions: AVAILABLE ↔ BORROWED ↔ UNAVAILABLE
 */

export interface Book {
  id: string;                    // Unique identifier
  libraryId: string;             // Foreign key to owning library

  // Required fields (C-002)
  title: string;                 // Required: Book title (1-500 chars)
  author: string;                // Required: Primary author name (1-200 chars)

  // Optional fields (C-002)
  edition?: string;              // Optional: Edition information (e.g., "2nd Edition")
  publicationDate?: string;      // Optional: ISO date string (YYYY or YYYY-MM-DD)
  isbn?: string;                 // Optional: ISBN-10 or ISBN-13
  coverImage?: string;           // Optional: URL or data URI

  // Status tracking
  status: BookStatus;            // Current availability status

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  addedBy: string;               // User ID who added the book
}

/**
 * Book availability status
 */
export enum BookStatus {
  AVAILABLE = 'AVAILABLE',       // Book can be borrowed
  BORROWED = 'BORROWED',         // Book is currently borrowed
  UNAVAILABLE = 'UNAVAILABLE'    // Book temporarily unavailable (maintenance, etc.)
}

/**
 * Form value type for creating/updating books
 * Excludes system-managed fields (id, timestamps, addedBy, status)
 */
export interface BookFormValue {
  libraryId: string;             // Required
  title: string;                 // Required
  author: string;                // Required
  edition?: string;              // Optional
  publicationDate?: string;      // Optional
  isbn?: string;                 // Optional
  coverImage?: string;           // Optional
}

/**
 * Type guard to check if an object is a valid Book
 */
export function isBook(obj: unknown): obj is Book {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const book = obj as Record<string, unknown>;
  return (
    typeof book['id'] === 'string' &&
    typeof book['libraryId'] === 'string' &&
    typeof book['title'] === 'string' &&
    typeof book['author'] === 'string' &&
    (book['edition'] === undefined || typeof book['edition'] === 'string') &&
    (book['publicationDate'] === undefined || typeof book['publicationDate'] === 'string') &&
    (book['isbn'] === undefined || typeof book['isbn'] === 'string') &&
    (book['coverImage'] === undefined || typeof book['coverImage'] === 'string') &&
    Object.values(BookStatus).includes(book['status'] as BookStatus) &&
    book['createdAt'] instanceof Date &&
    book['updatedAt'] instanceof Date &&
    typeof book['addedBy'] === 'string'
  );
}