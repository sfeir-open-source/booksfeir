import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {BookService} from './book.service';
import {DatastoreMockService} from './mock/datastore-mock.service';
import {AuthMockService} from './mock/auth-mock.service';
import {Book, BookStatus} from '../models/book.model';
import {of, throwError} from 'rxjs';
import {vi} from 'vitest';

describe('BookService', () => {
  let service: BookService;
  let datastoreMock: any;
  let authMock: any;

  const mockBook: Book = {
    id: 'book-1',
    libraryId: 'lib-1',
    title: 'Test Book',
    author: 'Test Author',
    edition: '1st Edition',
    publicationDate: '2023-01-01',
    isbn: '978-1234567890',
    coverImage: 'http://example.com/cover.jpg',
    status: BookStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    addedBy: 'mock-user-1'
  };

  const mockBooks: Book[] = [
    mockBook,
    {
      id: 'book-2',
      libraryId: 'lib-1',
      title: 'Another Book',
      author: 'Another Author',
      status: BookStatus.AVAILABLE,
      createdAt: new Date(),
      updatedAt: new Date(),
      addedBy: 'mock-user-1'
    }
  ];

  beforeEach(() => {
    const datastoreSpyObj = {
      query: vi.fn(),
      read: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    const authSpyObj = {
      getUserId: vi.fn()
    };
    authSpyObj.getUserId.mockReturnValue('mock-user-1');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        BookService,
        { provide: DatastoreMockService, useValue: datastoreSpyObj },
        { provide: AuthMockService, useValue: authSpyObj }
      ]
    });

    datastoreMock = TestBed.inject(DatastoreMockService) as any;
    authMock = TestBed.inject(AuthMockService) as any;

    // Default mock behavior
    datastoreMock.query.mockReturnValue(of([]));

    service = TestBed.inject(BookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getByLibrary', () => {
    it('should retrieve books for a library and update signal', () => {
      datastoreMock.query.mockReturnValue(of(mockBooks));

      service.getByLibrary('lib-1').subscribe(books => {
        expect(books.length).toBe(2);
        expect(service.books().length).toBe(2);
        expect(datastoreMock.query).toHaveBeenCalledWith('Book', expect.any(Function));

      });
    });

    it('should sort books by title', () => {
      const unsorted = [mockBooks[1], mockBooks[0]]; // Another Book, Test Book
      datastoreMock.query.mockReturnValue(of(unsorted));

      service.getByLibrary('lib-1').subscribe(books => {
        expect(books[0].title).toBe('Another Book');
        expect(books[1].title).toBe('Test Book');

      });
    });

    it('should filter books by libraryId', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockBooks.filter(predicate);
        return of(filtered);
      });

      service.getByLibrary('lib-1').subscribe(books => {
        expect(books.length).toBe(2);
        expect(books.every(b => b.libraryId === 'lib-1')).toBe(true);

      });
    });

    it('should return empty array on error', () => {
      datastoreMock.query.mockReturnValue(throwError(() => new Error('Test error')));

      service.getByLibrary('lib-1').subscribe(books => {
        expect(books).toEqual([]);

      });
    });
  });

  describe('getById', () => {
    it('should retrieve a book by ID', () => {
      datastoreMock.read.mockReturnValue(of(mockBook));

      service.getById('book-1').subscribe(book => {
        expect(book).toEqual(mockBook);
        expect(datastoreMock.read).toHaveBeenCalledWith('Book', 'book-1');

      });
    });

    it('should return null when book not found', () => {
      datastoreMock.read.mockReturnValue(of(null));

      service.getById('non-existent').subscribe(book => {
        expect(book).toBeNull();

      });
    });

    it('should return null on error', () => {
      datastoreMock.read.mockReturnValue(throwError(() => new Error('Test error')));

      service.getById('book-1').subscribe(book => {
        expect(book).toBeNull();

      });
    });
  });

  describe('search', () => {
    it('should search by title (case-insensitive)', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockBooks.filter(predicate);
        return of(filtered);
      });

      service.search('lib-1', 'test').subscribe(books => {
        expect(books.length).toBe(1);
        expect(books[0].title).toBe('Test Book');

      });
    });

    it('should search by author (case-insensitive)', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockBooks.filter(predicate);
        return of(filtered);
      });

      service.search('lib-1', 'another').subscribe(books => {
        expect(books.length).toBe(1);
        expect(books[0].author).toBe('Another Author');

      });
    });

    it('should trim search query', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockBooks.filter(predicate);
        return of(filtered);
      });

      service.search('lib-1', '  test  ').subscribe(books => {
        expect(books.length).toBe(1);

      });
    });

    it('should return all library books when query is empty', () => {
      datastoreMock.query.mockReturnValue(of(mockBooks));

      service.search('lib-1', '').subscribe(books => {
        expect(books.length).toBe(2);

      });
    });

    it('should return empty array on error', () => {
      datastoreMock.query.mockReturnValue(throwError(() => new Error('Test error')));

      service.search('lib-1', 'test').subscribe(books => {
        expect(books).toEqual([]);

      });
    });
  });

  describe('create', () => {
    it('should create a new book with required fields', () => {
      const formValue = {
        libraryId: 'lib-1',
        title: 'New Book',
        author: 'New Author'
      };

      datastoreMock.create.mockReturnValue(of({
        ...formValue,
        id: 'new-book',
        libraryId: 'lib-1',
        status: BookStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: 'mock-user-1'
      }));

      service.create('lib-1', formValue).subscribe(book => {
        expect(book.title).toBe('New Book');
        expect(book.author).toBe('New Author');
        expect(book.status).toBe(BookStatus.AVAILABLE);
        expect(datastoreMock.create).toHaveBeenCalledWith('Book', {
          libraryId: 'lib-1',
          title: 'New Book',
          author: 'New Author',
          status: BookStatus.AVAILABLE,
          addedBy: 'mock-user-1'
        });

      });
    });

    it('should create a book with optional fields', () => {
      const formValue = {
        libraryId: 'lib-1',
        title: 'New Book',
        author: 'New Author',
        edition: '2nd Edition',
        publicationDate: '2024-01-01',
        isbn: '978-9876543210',
        coverImage: 'http://example.com/new-cover.jpg'
      };

      datastoreMock.create.mockReturnValue(of({
        ...formValue,
        id: 'new-book',
        libraryId: 'lib-1',
        status: BookStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: 'mock-user-1'
      }));

      service.create('lib-1', formValue).subscribe(book => {
        expect(book.edition).toBe('2nd Edition');
        expect(book.publicationDate).toBe('2024-01-01');
        expect(book.isbn).toBe('978-9876543210');
        expect(book.coverImage).toBe('http://example.com/new-cover.jpg');

      });
    });

    it('should trim input values', () => {
      const formValue = {
        libraryId: 'lib-1',
        title: '  Spaced Title  ',
        author: '  Spaced Author  '
      };

      datastoreMock.create.mockReturnValue(of({
        id: 'new-book',
        libraryId: 'lib-1',
        title: 'Spaced Title',
        author: 'Spaced Author',
        status: BookStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: 'mock-user-1'
      }));

      service.create('lib-1', formValue).subscribe(() => {
        expect(datastoreMock.create).toHaveBeenCalledWith('Book', {
          title: 'Spaced Title',
          author: 'Spaced Author'
        });

      });
    });

    it('should throw error when user not authenticated', () => {
      authMock.getUserId.mockReturnValue(null);

      const formValue = { libraryId: 'lib-1', title: 'Test', author: 'Test' };

      expect(() => service.create('lib-1', formValue))
        .toThrowError('User must be authenticated to create a book');
    });

    it('should throw error when title is missing', () => {
      const formValue = { libraryId: 'lib-1', title: '', author: 'Test Author' };

      expect(() => service.create('lib-1', formValue))
        .toThrowError('Book title is required');
    });

    it('should throw error when author is missing', () => {
      const formValue = { libraryId: 'lib-1', title: 'Test Title', author: '' };

      expect(() => service.create('lib-1', formValue))
        .toThrowError('Book author is required');
    });

    it('should update signal with new book', () => {
      const formValue = {
        libraryId: 'lib-1',
        title: 'New Book',
        author: 'New Author'
      };

      const newBook: Book = {
        id: 'new-book',
        libraryId: 'lib-1',
        title: 'New Book',
        author: 'New Author',
        status: BookStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        addedBy: 'mock-user-1'
      };

      datastoreMock.create.mockReturnValue(of(newBook));
      datastoreMock.query.mockReturnValue(of([]));

      service.create('lib-1', formValue).subscribe(() => {
        const books = service.books();
        expect(books.length).toBe(1);
        expect(books[0].id).toBe('new-book');

      });
    });
  });

  describe('update', () => {
    it('should update a book', () => {
      const updates = { title: 'Updated Title', author: 'Updated Author' };
      const updated = { ...mockBook, ...updates, updatedAt: new Date() };

      datastoreMock.update.mockReturnValue(of(updated));

      service.update('book-1', updates).subscribe(book => {
        expect(book.title).toBe('Updated Title');
        expect(book.author).toBe('Updated Author');
        expect(datastoreMock.update).toHaveBeenCalledWith('Book', 'book-1', {
          title: 'Updated Title',
          author: 'Updated Author'
        });

      });
    });

    it('should trim update values', () => {
      const updates = { title: '  Spaced  ' };
      const updated = { ...mockBook, title: 'Spaced', updatedAt: new Date() };

      datastoreMock.update.mockReturnValue(of(updated));

      service.update('book-1', updates).subscribe(() => {
        expect(datastoreMock.update).toHaveBeenCalledWith('Book', 'book-1', {
          title: 'Spaced'
        });

      });
    });

    it('should throw error when title is empty', () => {
      expect(() => service.update('book-1', { title: '' }))
        .toThrowError('Book title cannot be empty');
    });

    it('should throw error when author is empty', () => {
      expect(() => service.update('book-1', { author: '' }))
        .toThrowError('Book author cannot be empty');
    });

    it('should update optional fields', () => {
      const updates = {
        edition: '3rd Edition',
        publicationDate: '2025-01-01',
        isbn: '978-1111111111',
        coverImage: 'http://example.com/updated.jpg'
      };
      const updated = { ...mockBook, ...updates, updatedAt: new Date() };

      datastoreMock.update.mockReturnValue(of(updated));

      service.update('book-1', updates).subscribe(book => {
        expect(book.edition).toBe('3rd Edition');
        expect(book.publicationDate).toBe('2025-01-01');
        expect(book.isbn).toBe('978-1111111111');

      });
    });
  });

  describe('delete', () => {
    it('should delete a book', () => {
      datastoreMock.delete.mockReturnValue(of(void 0));
      datastoreMock.query.mockReturnValue(of([mockBook]));

      // Load books first
      service.getByLibrary('lib-1').subscribe(() => {
        service.delete('book-1').subscribe(() => {
          expect(datastoreMock.delete).toHaveBeenCalledWith('Book', 'book-1');
          expect(service.books().length).toBe(0);

        });
      });
    });
  });

  describe('updateStatus', () => {
    it('should update book status to BORROWED', () => {
      const updated = { ...mockBook, status: BookStatus.BORROWED, updatedAt: new Date() };

      datastoreMock.update.mockReturnValue(of(updated));
      datastoreMock.query.mockReturnValue(of([mockBook]));

      // Load books first
      service.getByLibrary('lib-1').subscribe(() => {
        service.updateStatus('book-1', BookStatus.BORROWED).subscribe(book => {
          expect(book.status).toBe(BookStatus.BORROWED);
          expect(datastoreMock.update).toHaveBeenCalledWith('Book', 'book-1', {status: BookStatus.BORROWED});

        });
      });
    });

    it('should update book status to UNAVAILABLE', () => {
      const updated = { ...mockBook, status: BookStatus.UNAVAILABLE, updatedAt: new Date() };

      datastoreMock.update.mockReturnValue(of(updated));

      service.updateStatus('book-1', BookStatus.UNAVAILABLE).subscribe(book => {
        expect(book.status).toBe(BookStatus.UNAVAILABLE);

      });
    });

    it('should update signal with new status', () => {
      const updated = { ...mockBook, status: BookStatus.BORROWED, updatedAt: new Date() };

      datastoreMock.update.mockReturnValue(of(updated));
      datastoreMock.query.mockReturnValue(of([mockBook]));

      // Load books first
      service.getByLibrary('lib-1').subscribe(() => {
        service.updateStatus('book-1', BookStatus.BORROWED).subscribe(() => {
          const books = service.books();
          expect(books[0].status).toBe(BookStatus.BORROWED);

        });
      });
    });
  });
});
