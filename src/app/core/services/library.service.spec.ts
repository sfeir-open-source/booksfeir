import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {LibraryService} from './library.service';
import {DatastoreMockService} from './mock/datastore-mock.service';
import {AuthMockService} from './mock/auth-mock.service';
import {Library} from '../models/library.model';
import {Book, BookStatus} from '../models/book.model';
import {of, throwError} from 'rxjs';

describe('LibraryService', () => {
  let service: LibraryService;
  let datastoreMock: jasmine.SpyObj<DatastoreMockService>;
  let authMock: jasmine.SpyObj<AuthMockService>;

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
    const datastoreSpyObj = jasmine.createSpyObj('DatastoreMockService', [
      'list',
      'read',
      'create',
      'update',
      'delete',
      'query'
    ]);

    const authSpyObj = jasmine.createSpyObj('AuthMockService', ['getUserId']);
    authSpyObj.getUserId.and.returnValue('mock-user-1');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LibraryService,
        { provide: DatastoreMockService, useValue: datastoreSpyObj },
        { provide: AuthMockService, useValue: authSpyObj }
      ]
    });

    datastoreMock = TestBed.inject(DatastoreMockService) as jasmine.SpyObj<DatastoreMockService>;
    authMock = TestBed.inject(AuthMockService) as jasmine.SpyObj<AuthMockService>;

    // Default mock behavior - return empty array for list
    datastoreMock.list.and.returnValue(of([]));

    service = TestBed.inject(LibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should retrieve all libraries and update signal', (done) => {
      datastoreMock.list.and.returnValue(of(mockLibraries));

      service.getAll().subscribe(libraries => {
        expect(libraries.length).toBe(2);
        expect(service.libraries().length).toBe(2);
        expect(datastoreMock.list).toHaveBeenCalledWith('Library');
        done();
      });
    });

    it('should sort libraries by name', (done) => {
      const unsorted = [mockLibraries[1], mockLibraries[0]]; // Another Library, Test Library
      datastoreMock.list.and.returnValue(of(unsorted));

      service.getAll().subscribe(libraries => {
        expect(libraries[0].name).toBe('Another Library');
        expect(libraries[1].name).toBe('Test Library');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      datastoreMock.list.and.returnValue(throwError(() => new Error('Test error')));

      service.getAll().subscribe(libraries => {
        expect(libraries).toEqual([]);
        done();
      });
    });
  });

  describe('getById', () => {
    it('should retrieve a library by ID', (done) => {
      (datastoreMock.read as jasmine.Spy).and.returnValue(of(mockLibrary));

      service.getById('lib-1').subscribe(library => {
        expect(library).toEqual(mockLibrary);
        expect(datastoreMock.read).toHaveBeenCalledWith('Library', 'lib-1');
        done();
      });
    });

    it('should return null when library not found', (done) => {
      (datastoreMock.read as jasmine.Spy).and.returnValue(of(null));

      service.getById('non-existent').subscribe(library => {
        expect(library).toBeNull();
        done();
      });
    });

    it('should return null on error', (done) => {
      (datastoreMock.read as jasmine.Spy).and.returnValue(throwError(() => new Error('Test error')));

      service.getById('lib-1').subscribe(library => {
        expect(library).toBeNull();
        done();
      });
    });
  });

  describe('create', () => {
    it('should create a new library', (done) => {
      const formValue = {
        name: 'New Library',
        description: 'A new library',
        location: 'New Location'
      };

      (datastoreMock.create as jasmine.Spy).and.returnValue(of({
        ...formValue,
        id: 'new-lib',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-user-1'
      }));

      datastoreMock.list.and.returnValue(of([]));

      service.create(formValue).subscribe(library => {
        expect(library.name).toBe('New Library');
        expect(datastoreMock.create).toHaveBeenCalledWith('Library', jasmine.objectContaining({
          name: 'New Library',
          description: 'A new library',
          location: 'New Location',
          createdBy: 'mock-user-1'
        }));
        done();
      });
    });

    it('should trim input values', (done) => {
      const formValue = {
        name: '  Spaced Library  ',
        description: '  Spaced description  ',
        location: '  Spaced location  '
      };

      (datastoreMock.create as jasmine.Spy).and.returnValue(of({
        ...formValue,
        name: 'Spaced Library',
        id: 'new-lib',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-user-1'
      }));

      datastoreMock.list.and.returnValue(of([]));

      service.create(formValue).subscribe(() => {
        expect(datastoreMock.create).toHaveBeenCalledWith('Library', jasmine.objectContaining({
          name: 'Spaced Library',
          description: 'Spaced description',
          location: 'Spaced location'
        }));
        done();
      });
    });

    it('should throw error when user not authenticated', () => {
      authMock.getUserId.and.returnValue(null);

      const formValue = { name: 'Test' };

      expect(() => service.create(formValue)).toThrowError('User must be authenticated to create a library');
    });

    it('should update signal with new library in sorted order', (done) => {
      const formValue = { name: 'AAA First Library' };

      datastoreMock.list.and.returnValue(of([mockLibrary])); // Test Library
      (datastoreMock.create as jasmine.Spy).and.returnValue(of({
        id: 'new-lib',
        name: 'AAA First Library',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'mock-user-1'
      }));

      // Trigger reload with the new mock data
      service.refresh();

      // Wait for initial load
      setTimeout(() => {
        service.create(formValue).subscribe(() => {
          const libs = service.libraries();
          expect(libs[0].name).toBe('AAA First Library');
          expect(libs[1].name).toBe('Test Library');
          done();
        });
      }, 10);
    });
  });

  describe('update', () => {
    it('should update a library', (done) => {
      const updates = { name: 'Updated Name', description: 'Updated desc' };
      const updated = { ...mockLibrary, ...updates, updatedAt: new Date() };

      (datastoreMock.update as jasmine.Spy).and.returnValue(of(updated));
      datastoreMock.list.and.returnValue(of([mockLibrary]));

      // Wait for initial load
      setTimeout(() => {
        service.update('lib-1', updates).subscribe(library => {
          expect(library.name).toBe('Updated Name');
          expect(datastoreMock.update).toHaveBeenCalledWith('Library', 'lib-1', jasmine.objectContaining({
            name: 'Updated Name',
            description: 'Updated desc'
          }));
          done();
        });
      }, 10);
    });

    it('should trim update values', (done) => {
      const updates = { name: '  Spaced  ' };
      const updated = { ...mockLibrary, name: 'Spaced', updatedAt: new Date() };

      (datastoreMock.update as jasmine.Spy).and.returnValue(of(updated));
      datastoreMock.list.and.returnValue(of([mockLibrary]));

      setTimeout(() => {
        service.update('lib-1', updates).subscribe(() => {
          expect(datastoreMock.update).toHaveBeenCalledWith('Library', 'lib-1', jasmine.objectContaining({
            name: 'Spaced'
          }));
          done();
        });
      }, 10);
    });

    it('should update signal with updated library', (done) => {
      const updates = { name: 'Updated Library' };
      const updated = { ...mockLibrary, ...updates, updatedAt: new Date() };

      (datastoreMock.update as jasmine.Spy).and.returnValue(of(updated));
      datastoreMock.list.and.returnValue(of([mockLibrary]));

      // Trigger reload with the new mock data
      service.refresh();

      setTimeout(() => {
        service.update('lib-1', updates).subscribe(() => {
          const libs = service.libraries();
          expect(libs.find(l => l.id === 'lib-1')?.name).toBe('Updated Library');
          done();
        });
      }, 10);
    });
  });

  describe('delete', () => {
    it('should delete a library when allowed', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([])); // No borrowed books
      (datastoreMock.delete as jasmine.Spy).and.returnValue(of(void 0));
      datastoreMock.list.and.returnValue(of([mockLibrary]));

      setTimeout(() => {
        service.delete('lib-1').subscribe(() => {
          expect(datastoreMock.delete).toHaveBeenCalledWith('Library', 'lib-1');
          expect(service.libraries().length).toBe(0);
          done();
        });
      }, 10);
    });

    it('should throw error when library has borrowed books', (done) => {
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

      (datastoreMock.query as jasmine.Spy).and.returnValue(of([borrowedBook]));
      datastoreMock.list.and.returnValue(of([mockLibrary]));

      setTimeout(() => {
        service.delete('lib-1').subscribe({
          next: () => fail('Should have thrown error'),
          error: (error) => {
            expect(error.message).toContain('Cannot delete library with borrowed books');
            expect(datastoreMock.delete).not.toHaveBeenCalled();
            done();
          }
        });
      }, 10);
    });
  });

  describe('canDelete', () => {
    it('should return true when no borrowed books', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));

      service.canDelete('lib-1').subscribe(canDelete => {
        expect(canDelete).toBe(true);
        done();
      });
    });

    it('should return false when borrowed books exist', (done) => {
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

      (datastoreMock.query as jasmine.Spy).and.returnValue(of([borrowedBook]));

      service.canDelete('lib-1').subscribe(canDelete => {
        expect(canDelete).toBe(false);
        done();
      });
    });

    it('should return false on error', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(throwError(() => new Error('Test error')));

      service.canDelete('lib-1').subscribe(canDelete => {
        expect(canDelete).toBe(false);
        done();
      });
    });
  });

  describe('refresh', () => {
    it('should reload libraries', () => {
      datastoreMock.list.and.returnValue(of(mockLibraries));
      spyOn(service, 'getAll').and.returnValue(of(mockLibraries));

      service.refresh();

      expect(service.getAll).toHaveBeenCalled();
    });
  });
});
