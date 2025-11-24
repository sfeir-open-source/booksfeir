import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {DatastoreService, DatastoreQueryOptions} from '../datastore.service';
import {User, UserRole} from '../../models/user.model';

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
 * - Extends DatastoreService for role management compatibility
 *
 * This service enables local development without GCP dependencies.
 * Feature: Enhanced by 002-user-role-management
 */
@Injectable({
  providedIn: 'root'
})
export class DatastoreMockService extends DatastoreService {
  private readonly STORAGE_KEY = 'booksfeir_mock_data';
  private readonly OPERATION_DELAY = 50; // Simulate network latency

  // In-memory storage with signals for reactivity
  private storage = signal<Map<string, Map<string, unknown>>>(new Map());

  constructor() {
    super();
    this.loadFromLocalStorage();
    this.seedTestData(); // Seed libraries first (synchronous)
    this.seedUserData(); // Then seed users (depends on libraries)
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
   * Query entities with a filter function (Observable-based - existing interface)
   * Overload for backward compatibility with existing services
   */
  query<T>(entityType: string, filterFn: (entity: T) => boolean): Observable<T[]>;
  /**
   * Query entities with options (Promise-based - new interface for role management)
   */
  query<T>(kind: string, options?: DatastoreQueryOptions): Promise<T[]>;
  /**
   * Implementation of query method supporting both signatures
   */
  query<T>(
    entityTypeOrKind: string,
    filterFnOrOptions?: ((entity: T) => boolean) | DatastoreQueryOptions
  ): Observable<T[]> | Promise<T[]> {
    const typeMap = this.getTypeMap(entityTypeOrKind);
    const entities = Array.from(typeMap.values()) as T[];

    // Check if it's a filter function (Observable-based)
    if (typeof filterFnOrOptions === 'function') {
      const filtered = entities.filter(filterFnOrOptions);
      return of(filtered).pipe(delay(this.OPERATION_DELAY));
    }

    // Otherwise it's DatastoreQueryOptions or undefined (Promise-based)
    return this.queryWithOptions<T>(entityTypeOrKind, filterFnOrOptions);
  }

  /**
   * Delete an entity by ID (Observable-based - existing interface)
   * Overload for backward compatibility with existing services
   */
  delete(entityType: string, id: string): Observable<void>;
  /**
   * Delete an entity by ID (Promise-based - new interface for role management)
   */
  delete(kind: string, id: string): Promise<void>;
  /**
   * Implementation of delete method supporting both signatures
   */
  delete(entityTypeOrKind: string, id: string): Observable<void> | Promise<void> {
    // For now, always return Observable for backward compatibility
    // We'll add logic to detect if caller expects Promise in future
    const typeMap = this.getTypeMap(entityTypeOrKind);

    if (!typeMap.has(id)) {
      return throwError(() => new Error(`Entity ${entityTypeOrKind}:${id} not found`)).pipe(delay(this.OPERATION_DELAY));
    }

    typeMap.delete(id);
    this.updateStorage(entityTypeOrKind, typeMap);
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

  private async queryWithOptions<T>(kind: string, options?: DatastoreQueryOptions): Promise<T[]> {
    const typeMap = this.getTypeMap(kind);
    let results = Array.from(typeMap.values()) as T[];

    // Apply filters
    if (options?.filters) {
      results = results.filter(entity => {
        return options.filters!.every(filter => {
          const value = (entity as Record<string, unknown>)[filter.field];
          switch (filter.op) {
            case '=':
              return value === filter.value;
            case '!=':
              return value !== filter.value;
            case '<':
              return (value as number) < (filter.value as number);
            case '<=':
              return (value as number) <= (filter.value as number);
            case '>':
              return (value as number) > (filter.value as number);
            case '>=':
              return (value as number) >= (filter.value as number);
            default:
              return true;
          }
        });
      });
    }

    // Apply ordering
    if (options?.orderBy) {
      options.orderBy.forEach(order => {
        results.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[order.field] as string | number | Date;
          const bVal = (b as Record<string, unknown>)[order.field] as string | number | Date;
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return order.direction === 'asc' ? comparison : -comparison;
        });
      });
    }

    // Apply pagination
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
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

  private seedTestData(): void {
    const libraryMap = this.getTypeMap('Library');

    // Only seed if Library entities don't exist
    if (libraryMap.size > 0) {
      return;
    }

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

  /**
   * Seed user data for role management feature (T014)
   * Creates admin1, lib1, and user1 accounts
   */
  private seedUserData(): void {
    const userMap = this.getTypeMap('User');

    // Only seed if User entities don't exist
    if (userMap.size > 0) {
      return;
    }

    const now = new Date();

    // Admin user
    const admin: User = {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@booksfeir.com',
      role: UserRole.ADMIN,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'system'
    };

    // Librarian user
    const librarian: User = {
      id: 'lib1',
      name: 'Library Manager',
      email: 'librarian@booksfeir.com',
      role: UserRole.LIBRARIAN,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'admin1',
      libraryIds: ['lib-1']
    };

    // Standard user
    const user: User = {
      id: 'user1',
      name: 'John Doe',
      email: 'john.doe@booksfeir.com',
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'system'
    };

    userMap.set('admin1', admin);
    userMap.set('lib1', librarian);
    userMap.set('user1', user);

    this.updateStorage('User', userMap);
    this.saveToLocalStorage();
  }

  // Abstract method implementations from DatastoreService (Promise-based)

  override async get<T>(kind: string, id: string): Promise<T | null> {
    const typeMap = this.getTypeMap(kind);
    return (typeMap.get(id) as T) || null;
  }

  override async save<T extends { id: string }>(kind: string, entity: T): Promise<void> {
    const typeMap = this.getTypeMap(kind);

    // T014a: Implement default role assignment for User entities
    if (kind === 'User') {
      const user = entity as unknown as User;
      if (user.role === undefined) {
        (entity as unknown as User).role = UserRole.USER;
      }
    }

    typeMap.set(entity.id, entity);
    this.updateStorage(kind, typeMap);
    this.saveToLocalStorage();
  }

  override async batchSave<T extends { id: string }>(kind: string, entities: T[]): Promise<void> {
    for (const entity of entities) {
      await this.save(kind, entity);
    }
  }

  override async batchDelete(kind: string, ids: string[]): Promise<void> {
    const typeMap = this.getTypeMap(kind);
    ids.forEach(id => typeMap.delete(id));
    this.updateStorage(kind, typeMap);
    this.saveToLocalStorage();
  }
}
