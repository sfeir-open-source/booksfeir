import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { Library, LibraryFormValue } from '../models/library.model';
import { Book, BookStatus } from '../models/book.model';
import { DatastoreMockService } from './mock/datastore-mock.service';
import { AuthMockService } from './mock/auth-mock.service';

/**
 * LibraryService
 *
 * Manages library CRUD operations with signal-based reactive state.
 *
 * Business Rules:
 * - Libraries cannot be deleted if they contain borrowed books (FR-017)
 * - All operations use the DatastoreMockService for local development
 * - State is managed via signals for reactivity
 */
@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private datastore = inject(DatastoreMockService);
  private auth = inject(AuthMockService);

  // Private writable signal for libraries
  private librariesSignal = signal<Library[]>([]);

  // Public readonly signal
  libraries = this.librariesSignal.asReadonly();

  constructor() {
    // Load initial data
    this.loadLibraries();
  }

  /**
   * Get all libraries
   *
   * @returns Observable of all libraries, sorted by name ascending
   */
  getAll(): Observable<Library[]> {
    return this.datastore.list<Library>('Library').pipe(
      map(libs => this.sortByName(libs)),
      tap(libs => this.librariesSignal.set(libs)),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Get a single library by ID
   *
   * @param id - Library unique identifier
   * @returns Observable of library or null if not found
   */
  getById(id: string): Observable<Library | null> {
    return this.datastore.read<Library>('Library', id).pipe(
      catchError(err => {
        return of(null);
      })
    );
  }

  /**
   * Create a new library
   *
   * @param library - Library form data (name, description, location)
   * @returns Observable of created library with generated ID
   */
  create(library: LibraryFormValue): Observable<Library> {
    const userId = this.auth.getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create a library');
    }

    const libraryData = {
      name: library.name.trim(),
      description: library.description?.trim(),
      location: library.location?.trim(),
      createdBy: userId
    };

    return this.datastore.create<Library>('Library', libraryData).pipe(
      tap(created => {
        // Update local state
        const current = this.librariesSignal();
        this.librariesSignal.set(this.sortByName([...current, created]));
      })
    );
  }

  /**
   * Update an existing library
   *
   * @param id - Library unique identifier
   * @param updates - Partial library data to update
   * @returns Observable of updated library
   */
  update(id: string, updates: Partial<LibraryFormValue>): Observable<Library> {
    const cleanedUpdates: Partial<Library> = {};

    if (updates.name !== undefined) {
      cleanedUpdates.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      cleanedUpdates.description = updates.description.trim();
    }
    if (updates.location !== undefined) {
      cleanedUpdates.location = updates.location.trim();
    }

    return this.datastore.update<Library>('Library', id, cleanedUpdates).pipe(
      tap(updated => {
        // Update local state
        const current = this.librariesSignal();
        const index = current.findIndex(lib => lib.id === id);
        if (index !== -1) {
          const newLibs = [...current];
          newLibs[index] = updated;
          this.librariesSignal.set(this.sortByName(newLibs));
        }
      })
    );
  }

  /**
   * Delete a library
   *
   * Business Rule (FR-017): Cannot delete library containing borrowed books
   *
   * @param id - Library unique identifier
   * @returns Observable of void on success
   * @throws Error if library has borrowed books or not found
   */
  delete(id: string): Observable<void> {
    return this.canDelete(id).pipe(
      switchMap(canDelete => {
        if (!canDelete) {
          throw new Error('Cannot delete library with borrowed books. Please ensure all books are returned first.');
        }

        return this.datastore.delete('Library', id).pipe(
          tap(() => {
            // Update local state
            const current = this.librariesSignal();
            this.librariesSignal.set(current.filter(lib => lib.id !== id));
          })
        );
      })
    );
  }

  /**
   * Check if a library can be safely deleted
   *
   * @param id - Library unique identifier
   * @returns Observable of boolean (true if safe to delete)
   */
  canDelete(id: string): Observable<boolean> {
    return this.datastore.query<Book>('Book', (book: Book) => {
      return book.libraryId === id && book.status === BookStatus.BORROWED;
    }).pipe(
      map(borrowedBooks => borrowedBooks.length === 0),
      catchError(err => {
        return of(false);
      })
    );
  }

  /**
   * Refresh libraries from datastore
   */
  refresh(): void {
    this.getAll().subscribe();
  }

  // Private helper methods

  private loadLibraries(): void {
    this.getAll().subscribe();
  }

  private sortByName(libraries: Library[]): Library[] {
    return [...libraries].sort((a, b) => a.name.localeCompare(b.name));
  }
}
