import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Book, BookFormValue, BookStatus } from '../models/book.model';
import { DatastoreMockService } from './mock/datastore-mock.service';
import { AuthMockService } from './mock/auth-mock.service';

/**
 * BookService
 *
 * Manages book CRUD operations within libraries with signal-based reactive state.
 *
 * Business Rules:
 * - Title and author are required (C-002)
 * - Other fields (edition, publicationDate, isbn, coverImage) are optional
 * - Books start with status AVAILABLE
 * - Duplicate books allowed (represent multiple physical copies)
 */
@Injectable({
  providedIn: 'root'
})
export class BookService {
  private datastore = inject(DatastoreMockService);
  private auth = inject(AuthMockService);

  // Private writable signal for books cache
  private booksSignal = signal<Book[]>([]);

  // Public readonly signal
  books = this.booksSignal.asReadonly();

  /**
   * Get all books in a specific library
   *
   * @param libraryId - Library unique identifier
   * @returns Observable of books in the library, sorted by title ascending
   */
  getByLibrary(libraryId: string): Observable<Book[]> {
    return this.datastore.query<Book>('Book', (book: Book) => book.libraryId === libraryId).pipe(
      map(books => this.sortByTitle(books)),
      tap(books => {
        // Update cache for this library
        const current = this.booksSignal();
        const otherLibraryBooks = current.filter(b => b.libraryId !== libraryId);
        this.booksSignal.set([...otherLibraryBooks, ...books]);
      }),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Get a single book by ID
   *
   * @param id - Book unique identifier
   * @returns Observable of book or null if not found
   */
  getById(id: string): Observable<Book | null> {
    return this.datastore.read<Book>('Book', id).pipe(
      catchError(err => {
        return of(null);
      })
    );
  }

  /**
   * Search books within a library by query string
   *
   * Searches title and author fields (case-insensitive partial match)
   *
   * @param libraryId - Library unique identifier
   * @param query - Search query string
   * @returns Observable of matching books
   */
  search(libraryId: string, query: string): Observable<Book[]> {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return this.getByLibrary(libraryId);
    }

    return this.datastore.query<Book>('Book', (book: Book) => {
      return book.libraryId === libraryId &&
        (book.title.toLowerCase().includes(lowerQuery) ||
         book.author.toLowerCase().includes(lowerQuery));
    }).pipe(
      map(books => this.sortByTitle(books)),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Create a new book in a library
   *
   * Business Rule (C-002): Title and author are required; other fields optional
   *
   * @param libraryId - Library unique identifier
   * @param book - Book form data
   * @returns Observable of created book with generated ID
   */
  create(libraryId: string, book: BookFormValue): Observable<Book> {
    const userId = this.auth.getUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create a book');
    }

    if (!book.title?.trim()) {
      throw new Error('Book title is required');
    }

    if (!book.author?.trim()) {
      throw new Error('Book author is required');
    }

    const bookData = {
      libraryId,
      title: book.title.trim(),
      author: book.author.trim(),
      edition: book.edition?.trim(),
      publicationDate: book.publicationDate?.trim(),
      isbn: book.isbn?.trim(),
      coverImage: book.coverImage?.trim(),
      status: BookStatus.AVAILABLE,
      addedBy: userId
    };

    return this.datastore.create<Book>('Book', bookData).pipe(
      tap(created => {
        // Update local cache
        const current = this.booksSignal();
        this.booksSignal.set([...current, created]);
      })
    );
  }

  /**
   * Update an existing book
   *
   * @param id - Book unique identifier
   * @param updates - Partial book data to update
   * @returns Observable of updated book
   */
  update(id: string, updates: Partial<BookFormValue>): Observable<Book> {
    const cleanedUpdates: Partial<Book> = {};

    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        throw new Error('Book title cannot be empty');
      }
      cleanedUpdates.title = updates.title.trim();
    }

    if (updates.author !== undefined) {
      if (!updates.author.trim()) {
        throw new Error('Book author cannot be empty');
      }
      cleanedUpdates.author = updates.author.trim();
    }

    if (updates.edition !== undefined) {
      cleanedUpdates.edition = updates.edition.trim();
    }

    if (updates.publicationDate !== undefined) {
      cleanedUpdates.publicationDate = updates.publicationDate.trim();
    }

    if (updates.isbn !== undefined) {
      cleanedUpdates.isbn = updates.isbn.trim();
    }

    if (updates.coverImage !== undefined) {
      cleanedUpdates.coverImage = updates.coverImage.trim();
    }

    return this.datastore.update<Book>('Book', id, cleanedUpdates).pipe(
      tap(updated => {
        // Update local cache
        const current = this.booksSignal();
        const index = current.findIndex(b => b.id === id);
        if (index !== -1) {
          const newBooks = [...current];
          newBooks[index] = updated;
          this.booksSignal.set(newBooks);
        }
      })
    );
  }

  /**
   * Delete a book from a library
   *
   * @param id - Book unique identifier
   * @returns Observable of void on success
   */
  delete(id: string): Observable<void> {
    return this.datastore.delete('Book', id).pipe(
      tap(() => {
        // Update local cache
        const current = this.booksSignal();
        this.booksSignal.set(current.filter(b => b.id !== id));
      })
    );
  }

  /**
   * Update book status (AVAILABLE, BORROWED, UNAVAILABLE)
   *
   * @param id - Book unique identifier
   * @param status - New book status
   * @returns Observable of updated book
   */
  updateStatus(id: string, status: BookStatus): Observable<Book> {
    return this.datastore.update<Book>('Book', id, { status }).pipe(
      tap(updated => {
        // Update local cache
        const current = this.booksSignal();
        const index = current.findIndex(b => b.id === id);
        if (index !== -1) {
          const newBooks = [...current];
          newBooks[index] = updated;
          this.booksSignal.set(newBooks);
        }
      })
    );
  }

  // Private helper methods

  private sortByTitle(books: Book[]): Book[] {
    return [...books].sort((a, b) => a.title.localeCompare(b.title));
  }
}
