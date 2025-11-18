/**
 * Library Service Contract
 *
 * Defines the interface for library management operations.
 * Implementations: DatastoreMockService (dev), DatastoreGcpService (prod)
 */

import { Observable } from 'rxjs';
import { Library, LibraryFormValue } from '../data-model';

export interface LibraryService {
  /**
   * Get all libraries
   *
   * @returns Observable of all libraries, sorted by name ascending
   * @emits Array of Library objects
   * @errors Never throws (returns empty array on error)
   */
  getAll(): Observable<Library[]>;

  /**
   * Get a single library by ID
   *
   * @param id - Library unique identifier
   * @returns Observable of library or null if not found
   * @emits Library object or null
   * @errors Never throws (returns null on error)
   */
  getById(id: string): Observable<Library | null>;

  /**
   * Create a new library
   *
   * @param library - Library form data (name, description, location)
   * @returns Observable of created library with generated ID
   * @emits Created Library object with id, timestamps, createdBy
   * @errors Throws if validation fails or storage fails
   */
  create(library: LibraryFormValue): Observable<Library>;

  /**
   * Update an existing library
   *
   * @param id - Library unique identifier
   * @param updates - Partial library data to update
   * @returns Observable of updated library
   * @emits Updated Library object with new updatedAt timestamp
   * @errors Throws if library not found or validation fails
   */
  update(id: string, updates: Partial<LibraryFormValue>): Observable<Library>;

  /**
   * Delete a library
   *
   * Business Rule (FR-017): Cannot delete library containing borrowed books
   *
   * @param id - Library unique identifier
   * @returns Observable of void on success
   * @emits void
   * @errors Throws if library has borrowed books or not found
   * @errorMessage "Cannot delete library with borrowed books. Please ensure all books are returned first."
   */
  delete(id: string): Observable<void>;

  /**
   * Check if a library can be safely deleted
   *
   * @param id - Library unique identifier
   * @returns Observable of boolean (true if safe to delete)
   * @emits true if no borrowed books, false otherwise
   * @errors Never throws (returns false on error)
   */
  canDelete(id: string): Observable<boolean>;
}