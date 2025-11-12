/**
 * Book Service Contract
 *
 * Defines the interface for book management operations within libraries.
 * Implementations: DatastoreMockService (dev), DatastoreGcpService (prod)
 */

import { Observable } from 'rxjs';
import { Book, BookFormValue, BookStatus } from '../data-model';

export interface BookService {
  /**
   * Get all books in a specific library
   *
   * @param libraryId - Library unique identifier
   * @returns Observable of books in the library, sorted by title ascending
   * @emits Array of Book objects
   * @errors Never throws (returns empty array on error)
   */
  getByLibrary(libraryId: string): Observable<Book[]>;

  /**
   * Get a single book by ID
   *
   * @param id - Book unique identifier
   * @returns Observable of book or null if not found
   * @emits Book object or null
   * @errors Never throws (returns null on error)
   */
  getById(id: string): Observable<Book | null>;

  /**
   * Search books within a library by query string
   *
   * Searches title and author fields (case-insensitive partial match)
   *
   * @param libraryId - Library unique identifier
   * @param query - Search query string
   * @returns Observable of matching books
   * @emits Array of Book objects matching query
   * @errors Never throws (returns empty array on error)
   */
  search(libraryId: string, query: string): Observable<Book[]>;

  /**
   * Create a new book in a library
   *
   * Business Rule (C-002): Title and author are required; other fields optional
   *
   * @param libraryId - Library unique identifier
   * @param book - Book form data
   * @returns Observable of created book with generated ID
   * @emits Created Book object with id, timestamps, status=AVAILABLE
   * @errors Throws if validation fails (title/author missing) or library not found
   */
  create(libraryId: string, book: BookFormValue): Observable<Book>;

  /**
   * Update an existing book
   *
   * @param id - Book unique identifier
   * @param updates - Partial book data to update
   * @returns Observable of updated book
   * @emits Updated Book object with new updatedAt timestamp
   * @errors Throws if book not found or validation fails
   */
  update(id: string, updates: Partial<BookFormValue>): Observable<Book>;

  /**
   * Delete a book from a library
   *
   * @param id - Book unique identifier
   * @returns Observable of void on success
   * @emits void
   * @errors Throws if book not found
   * @note Book can be deleted regardless of borrow status (returns will fail)
   */
  delete(id: string): Observable<void>;

  /**
   * Update book status
   *
   * @param id - Book unique identifier
   * @param status - New status (AVAILABLE, BORROWED, UNAVAILABLE)
   * @returns Observable of updated book
   * @emits Updated Book object
   * @errors Throws if book not found
   */
  updateStatus(id: string, status: BookStatus): Observable<Book>;

  /**
   * Check if a book is currently borrowed
   *
   * @param id - Book unique identifier
   * @returns Observable of boolean
   * @emits true if book status is BORROWED, false otherwise
   * @errors Never throws (returns false on error)
   */
  isBorrowed(id: string): Observable<boolean>;
}