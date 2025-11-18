import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';

/**
 * DatastoreMockService
 *
 * In-memory mock implementation of GCP Datastore for local development.
 * Features:
 * - Signal-based reactive storage
 * - localStorage persistence across browser refreshes
 * - Simulated async operations (50-100ms delay)
 * - Auto-generated IDs
 * - CRUD operations for all entity types
 *
 * This service enables local development without GCP dependencies.
 */
@Injectable({
  providedIn: 'root'
})
export class DatastoreMockService {
  private readonly STORAGE_KEY = 'booksfeir_mock_data';
  private readonly OPERATION_DELAY = 50; // Simulate network latency

  // In-memory storage with signals for reactivity
  private storage = signal<Map<string, Map<string, unknown>>>(new Map());

  constructor() {
    this.loadFromLocalStorage();
    this.initializeTestData();
  }

  /**
   * Create a new entity
   */
  create<T extends { id: string; createdAt?: Date; updatedAt?: Date }>(
    entityType: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<T> {
    const id = this.generateId();
    const now = new Date();
    const entity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    } as T;

    const typeMap = this.getTypeMap(entityType);
    typeMap.set(id, entity);
    this.updateStorage(entityType, typeMap);
    this.saveToLocalStorage();

    return of(entity).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * Read an entity by ID
   */
  read<T>(entityType: string, id: string): Observable<T | null> {
    const typeMap = this.getTypeMap(entityType);
    const entity = typeMap.get(id) as T | undefined;

    return of(entity ?? null).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * Update an existing entity
   */
  update<T extends { id: string; updatedAt?: Date }>(entityType: string, id: string, updates: Partial<T>): Observable<T> {
    const typeMap = this.getTypeMap(entityType);
    const existing = typeMap.get(id);

    if (!existing) {
      return throwError(() => new Error(`Entity ${entityType}:${id} not found`)).pipe(delay(this.OPERATION_DELAY));
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID is not overwritten
      updatedAt: new Date()
    } as T;

    typeMap.set(id, updated);
    this.updateStorage(entityType, typeMap);
    this.saveToLocalStorage();

    return of(updated).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * Delete an entity by ID
   */
  delete(entityType: string, id: string): Observable<void> {
    const typeMap = this.getTypeMap(entityType);

    if (!typeMap.has(id)) {
      return throwError(() => new Error(`Entity ${entityType}:${id} not found`)).pipe(delay(this.OPERATION_DELAY));
    }

    typeMap.delete(id);
    this.updateStorage(entityType, typeMap);
    this.saveToLocalStorage();

    return of(void 0).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * List all entities of a type
   */
  list<T>(entityType: string): Observable<T[]> {
    const typeMap = this.getTypeMap(entityType);
    const entities = Array.from(typeMap.values()) as T[];

    return of(entities).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * Query entities with a filter function
   */
  query<T>(entityType: string, filterFn: (entity: T) => boolean): Observable<T[]> {
    const typeMap = this.getTypeMap(entityType);
    const entities = Array.from(typeMap.values()) as T[];
    const filtered = entities.filter(filterFn);

    return of(filtered).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * Count entities matching a filter
   */
  count(entityType: string, filterFn?: (entity: unknown) => boolean): Observable<number> {
    const typeMap = this.getTypeMap(entityType);
    const entities = Array.from(typeMap.values());
    const count = filterFn ? entities.filter(filterFn).length : entities.length;

    return of(count).pipe(delay(this.OPERATION_DELAY));
  }

  /**
   * Clear all data (useful for testing)
   */
  clearAll(): void {
    this.storage.set(new Map());
    this.saveToLocalStorage();
  }

  // Private helper methods

  private getTypeMap(entityType: string): Map<string, unknown> {
    const currentStorage = this.storage();
    let typeMap = currentStorage.get(entityType);

    if (!typeMap) {
      typeMap = new Map();
      currentStorage.set(entityType, typeMap);
      this.storage.set(new Map(currentStorage));
    }

    return typeMap;
  }

  private updateStorage(entityType: string, typeMap: Map<string, unknown>): void {
    const currentStorage = this.storage();
    currentStorage.set(entityType, typeMap);
    this.storage.set(new Map(currentStorage));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored, this.dateReviver);
        const storageMap = new Map<string, Map<string, unknown>>();

        Object.entries(parsed).forEach(([entityType, entities]) => {
          const typeMap = new Map<string, unknown>();
          Object.entries(entities as Record<string, unknown>).forEach(([id, entity]) => {
            typeMap.set(id, entity);
          });
          storageMap.set(entityType, typeMap);
        });

        this.storage.set(storageMap);
      }
    } catch (error) {
      // Failed to load from localStorage
    }
  }

  private saveToLocalStorage(): void {
    try {
      const currentStorage = this.storage();
      const serializable: Record<string, Record<string, unknown>> = {};

      currentStorage.forEach((typeMap, entityType) => {
        serializable[entityType] = {};
        typeMap.forEach((entity, id) => {
          serializable[entityType][id] = entity;
        });
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      // Failed to save to localStorage
    }
  }

  private dateReviver(key: string, value: unknown): unknown {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  }

  private initializeTestData(): void {
    // Check if data already exists
    this.list('Library').subscribe(libraries => {
      if (libraries.length === 0) {
        // Seed initial test data
        this.seedTestData();
      }
    });
  }

  private seedTestData(): void {
    const now = new Date();
    const mockUserId = 'mock-user-1';

    // Create test libraries
    const libraries = [
      {
        id: 'lib-1',
        name: 'Main Library',
        description: 'The primary collection of technical books and resources',
        location: 'Building A, Floor 2',
        createdBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'lib-2',
        name: 'Design Library',
        description: 'Books about UX, UI, and graphic design',
        location: 'Building B, Floor 3',
        createdBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'lib-3',
        name: 'Fiction Corner',
        description: 'Novels and fiction for leisure reading',
        location: 'Lounge Area',
        createdBy: mockUserId,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Manually add libraries to storage to get consistent IDs
    const libraryMap = new Map<string, unknown>();
    libraries.forEach(lib => {
      libraryMap.set(lib.id, lib);
    });
    this.updateStorage('Library', libraryMap);

    // Create test books
    const books = [
      // Main Library - Technical books
      {
        libraryId: 'lib-1',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        edition: '1st Edition',
        publicationDate: '2008',
        isbn: '978-0132350884',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-1',
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt',
        edition: '2nd Edition',
        publicationDate: '2019',
        isbn: '978-0135957059',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-1',
        title: 'Design Patterns',
        author: 'Erich Gamma',
        publicationDate: '1994',
        isbn: '978-0201633610',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      // Design Library - Design books
      {
        libraryId: 'lib-2',
        title: 'Don\'t Make Me Think',
        author: 'Steve Krug',
        edition: '3rd Edition',
        publicationDate: '2014',
        isbn: '978-0321965516',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-2',
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        publicationDate: '2013',
        isbn: '978-0465050659',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-2',
        title: 'Refactoring UI',
        author: 'Adam Wathan',
        publicationDate: '2018',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      // Fiction Corner - Novels
      {
        libraryId: 'lib-3',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        publicationDate: '1937',
        isbn: '978-0547928227',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-3',
        title: '1984',
        author: 'George Orwell',
        publicationDate: '1949',
        isbn: '978-0451524935',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-3',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        publicationDate: '1960',
        isbn: '978-0061120084',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      },
      {
        libraryId: 'lib-3',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publicationDate: '1925',
        isbn: '978-0743273565',
        status: 'AVAILABLE',
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Manually add books to storage
    const bookMap = new Map<string, unknown>();
    books.forEach((book, index) => {
      const id = `book-${index + 1}`;
      bookMap.set(id, { ...book, id });
    });
    this.updateStorage('Book', bookMap);

    this.saveToLocalStorage();
  }
}
