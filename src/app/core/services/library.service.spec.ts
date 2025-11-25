import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {LibraryService} from './library.service';
import {DatastoreMockService} from './mock/datastore-mock.service';
import {AuthMockService} from './mock/auth-mock.service';
import {Library} from '../models/library.model';
import {Book, BookStatus} from '../models/book.model';
import {of, throwError} from 'rxjs';
import {expect, vi} from 'vitest';

describe('LibraryService', () => {
  let service: LibraryService;
  let datastoreMock: any;
  let authMock: any;

  const mockLibrary: Library = {
    id: 'lib-1',
    name: 'Test Library',
    description: 'A test library',
    location: 'Test Location',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'mock-user-1'
  };

  const mockLibraries: Library[] = [
    mockLibrary,
    {
      id: 'lib-2',
      name: 'Another Library',
      description: 'Another test library',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'mock-user-1'
    }
  ];

  beforeEach(() => {
    // Create spy objects
    const datastoreSpyObj = {
      list: vi.fn(),
      read: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      query: vi.fn()
    };

    const authSpyObj = {
      getUserId: vi.fn()
    };
    authSpyObj.getUserId.mockReturnValue('mock-user-1');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LibraryService,
        { provide: DatastoreMockService, useValue: datastoreSpyObj },
        { provide: AuthMockService, useValue: authSpyObj }
      ]
    });

    datastoreMock = TestBed.inject(DatastoreMockService) as any;
    authMock = TestBed.inject(AuthMockService) as any;

    // Default mock behavior - return empty array for list
    datastoreMock.list.mockReturnValue(of([]));

    service = TestBed.inject(LibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should retrieve all libraries and update signal', () => {
      datastoreMock.list.mockReturnValue(of(mockLibraries));

      service.getAll().subscribe(libraries => {
        expect(libraries.length).toBe(2);
        expect(service.libraries().length).toBe(2);
        expect(datastoreMock.list).toHaveBeenCalledWith('Library');

      });
    });

    it('should sort libraries by name', () => {
      const unsorted = [mockLibraries[1], mockLibraries[0]]; // Another Library, Test Library
      datastoreMock.list.mockReturnValue(of(unsorted));

      service.getAll().subscribe(libraries => {
        expect(libraries[0].name).toBe('Another Library');
        expect(libraries[1].name).toBe('Test Library');

      });
    });

    it('should return empty array on error', () => {
      datastoreMock.list.mockReturnValue(throwError(() => new Error('Test error')));

      service.getAll().subscribe(libraries => {
        expect(libraries).toEqual([]);

      });
    });
  });

  describe('getById', () => {
    it('should retrieve a library by ID', () => {
      datastoreMock.read.mockReturnValue(of(mockLibrary));

      service.getById('lib-1').subscribe(library => {
        expect(library).toEqual(mockLibrary);
        expect(datastoreMock.read).toHaveBeenCalledWith('Library', 'lib-1');

      });
    });

    it('should return null when library not found', () => {
      datastoreMock.read.mockReturnValue(of(null));

      service.getById('non-existent').subscribe(library => {
        expect(library).toBeNull();

      });
    });

    it('should return null on error', () => {
      datastoreMock.read.mockReturnValue(throwError(() => new Error('Test error')));

      service.getById('lib-1').subscribe(library => {
        expect(library).toBeNull();

      });
    });
  });

  describe('create', () => {
    it('should create a new library', () => {
      const formValue = {
        name: 'New Library',
        description: 'A new library',
        location: 'New Location'
      };

      datastoreMock.create.mockReturnValue(of({
        ...formValue,
        id: 'new-lib',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-user-1'
      }));

      datastoreMock.list.mockReturnValue(of([]));

      service.create(formValue).subscribe(library => {
        expect(library.name).toBe('New Library');
        expect(datastoreMock.create).toHaveBeenCalledWith('Library', {
          name: 'New Library',
          description: 'A new library',
          location: 'New Location',
          createdBy: 'mock-user-1'
        });

      });
    });

    it('should trim input values', () => {
      const formValue = {
        name: '  Spaced Library  ',
        description: '  Spaced description  ',
        location: '  Spaced location  '
      };

      datastoreMock.create.mockReturnValue(of({
        ...formValue,
        name: 'Spaced Library',
        id: 'new-lib',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-user-1'
      }));

      datastoreMock.list.mockReturnValue(of([]));

      service.create(formValue).subscribe(() => {
        expect(datastoreMock.create).toHaveBeenCalledWith('Library', expect.objectContaining({
          name: 'Spaced Library',
          description: 'Spaced description',
          location: 'Spaced location'
        }));

      });
    });

    it('should throw error when user not authenticated', () => {
      authMock.getUserId.mockReturnValue(null);

      const formValue = { name: 'Test' };

      expect(() => service.create(formValue)).toThrowError('User must be authenticated to create a library');
    });

    it('should update signal with new library in sorted order', async () => {
      const formValue = { name: 'AAA First Library' };

      datastoreMock.list.mockReturnValue(of([mockLibrary])); // Test Library
      datastoreMock.create.mockReturnValue(of({
        id: 'new-lib',
        name: 'AAA First Library',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-user-1'
      }));

      // Trigger reload with the new mock data
      service.refresh();

      await new Promise<void>((resolve) => {
        service.create(formValue).subscribe(() => {
          const libs = service.libraries();
          expect(libs[0].name).toBe('AAA First Library');
          expect(libs[1].name).toBe('Test Library');
          resolve();
        });
      });
    });
  });

  describe('update', () => {
    it('should update a library', async () => {
      const updates = { name: 'Updated Name', description: 'Updated desc' };
      const updated = { ...mockLibrary, ...updates, updatedAt: new Date() };

      datastoreMock.list.mockReturnValue(of([mockLibrary]));
      datastoreMock.update.mockReturnValue(of(updated));

      // Wait for initial load
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          service.update('lib-1', updates).subscribe(library => {
            expect(library.name).toBe('Updated Name');
            expect(datastoreMock.update).toHaveBeenCalledWith('Library', 'lib-1', {
              name: 'Updated Name',
              description: 'Updated desc'
            });
            resolve();
          });
        }, 10);
      });
    });

    it('should trim update values', async () => {
      const updates = { name: '  Spaced  ' };
      const updated = { ...mockLibrary, name: 'Spaced', updatedAt: new Date() };

      datastoreMock.list.mockReturnValue(of([mockLibrary]));
      datastoreMock.update.mockReturnValue(of(updated));

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          service.update('lib-1', updates).subscribe(() => {
            expect(datastoreMock.update).toHaveBeenCalledWith('Library', 'lib-1', {
              name: 'Spaced'
            });
            resolve();
          });
        }, 10);
      });
    });

    it('should update signal with updated library', async () => {
      const updates = { name: 'Updated Library' };
      const updated = { ...mockLibrary, ...updates, updatedAt: new Date() };

      datastoreMock.list.mockReturnValue(of([mockLibrary]));
      datastoreMock.update.mockReturnValue(of(updated));

      // Trigger reload with the new mock data
      service.refresh();

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          service.update('lib-1', updates).subscribe(() => {
            const libs = service.libraries();
            expect(libs.find(l => l.id === 'lib-1')?.name).toBe('Updated Library');
            resolve();
          });
        }, 10);
      });
    });
  });

  describe('delete', () => {
    it('should delete a library when allowed', async () => {
      datastoreMock.list.mockReturnValue(of([mockLibrary]));
      datastoreMock.query.mockReturnValue(of([])); // No borrowed books
      datastoreMock.delete.mockReturnValue(of(void 0));

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          service.delete('lib-1').subscribe(() => {
            expect(datastoreMock.delete).toHaveBeenCalledWith('Library', 'lib-1');
            expect(service.libraries().length).toBe(0);
            resolve();
          });
        }, 10);
      });
    });

    it('should throw error when library has borrowed books', async () => {
      const borrowedBook: Book = {
        id: 'book-1',
        libraryId: 'lib-1',
        title: 'Test Book',
        author: 'Test Author',
        status: BookStatus.BORROWED,
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: 'user-1'
      };

      datastoreMock.list.mockReturnValue(of([mockLibrary]));
      datastoreMock.query.mockReturnValue(of([borrowedBook]));

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          service.delete('lib-1').subscribe({
            error: (error) => {
              expect(error.message).toContain('Cannot delete library with borrowed books');
              expect(datastoreMock.delete).not.toHaveBeenCalled();
              resolve();
            }
          });
        }, 10);
      });
    });
  });

  describe('canDelete', () => {
    it('should return true when no borrowed books', () => {
      datastoreMock.query.mockReturnValue(of([]));

      service.canDelete('lib-1').subscribe(canDelete => {
        expect(canDelete).toBe(true);

      });
    });

    it('should return false when borrowed books exist', () => {
      const borrowedBook: Book = {
        id: 'book-1',
        libraryId: 'lib-1',
        title: 'Test Book',
        author: 'Test Author',
        status: BookStatus.BORROWED,
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: 'user-1'
      };

      datastoreMock.query.mockReturnValue(of([borrowedBook]));

      service.canDelete('lib-1').subscribe(canDelete => {
        expect(canDelete).toBe(false);

      });
    });

    it('should return false on error', () => {
      datastoreMock.query.mockReturnValue(throwError(() => new Error('Test error')));

      service.canDelete('lib-1').subscribe(canDelete => {
        expect(canDelete).toBe(false);

      });
    });
  });

  describe('refresh', () => {
    it('should reload libraries', () => {
      datastoreMock.list.mockReturnValue(of(mockLibraries));
      vi.spyOn(service, 'getAll').mockReturnValue(of(mockLibraries));

      service.refresh();

      expect(service.getAll).toHaveBeenCalled();
    });
  });
});
