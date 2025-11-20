import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {BorrowService} from './borrow.service';
import {DatastoreMockService} from './mock/datastore-mock.service';
import {BookService} from './book.service';
import {LibraryService} from './library.service';
import {AuthMockService} from './mock/auth-mock.service';
import {BorrowStatus, BorrowTransaction} from '../models/borrow-transaction.model';
import {Book, BookStatus} from '../models/book.model';
import {Library} from '../models/library.model';
import {of, throwError} from 'rxjs';

describe('BorrowService', () => {
  let service: BorrowService;
  let datastoreMock: jasmine.SpyObj<DatastoreMockService>;
  let bookServiceMock: jasmine.SpyObj<BookService>;
  let libraryServiceMock: jasmine.SpyObj<LibraryService>;
  let authMock: jasmine.SpyObj<AuthMockService>;

  const mockBook: Book = {
    id: 'book-1',
    libraryId: 'lib-1',
    title: 'Test Book',
    author: 'Test Author',
    status: BookStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    addedBy: 'user-1'
  };

  const mockLibrary: Library = {
    id: 'lib-1',
    name: 'Test Library',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1'
  };

  const mockTransaction: BorrowTransaction = {
    id: 'txn-1',
    bookId: 'book-1',
    userId: 'user-1',
    libraryId: 'lib-1',
    status: BorrowStatus.ACTIVE,
    borrowedAt: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    const datastoreSpyObj = jasmine.createSpyObj('DatastoreMockService', [
      'query',
      'read',
      'create',
      'update'
    ]);

    const bookServiceSpyObj = jasmine.createSpyObj('BookService', [
      'getById',
      'updateStatus'
    ]);

    const libraryServiceSpyObj = jasmine.createSpyObj('LibraryService', [
      'getById'
    ]);

    const authSpyObj = jasmine.createSpyObj('AuthMockService', ['currentUser']);
    authSpyObj.currentUser.and.returnValue({ id: 'user-1', name: 'Test User', email: 'test@example.com' });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        BorrowService,
        { provide: DatastoreMockService, useValue: datastoreSpyObj },
        { provide: BookService, useValue: bookServiceSpyObj },
        { provide: LibraryService, useValue: libraryServiceSpyObj },
        { provide: AuthMockService, useValue: authSpyObj }
      ]
    });

    datastoreMock = TestBed.inject(DatastoreMockService) as jasmine.SpyObj<DatastoreMockService>;
    bookServiceMock = TestBed.inject(BookService) as jasmine.SpyObj<BookService>;
    libraryServiceMock = TestBed.inject(LibraryService) as jasmine.SpyObj<LibraryService>;
    authMock = TestBed.inject(AuthMockService) as jasmine.SpyObj<AuthMockService>;

    // Default mock behavior
    (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));
    bookServiceMock.getById.and.returnValue(of(mockBook));
    libraryServiceMock.getById.and.returnValue(of(mockLibrary));

    service = TestBed.inject(BorrowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserBorrows', () => {
    it('should retrieve active borrows for a user', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([mockTransaction]));

      service.getUserBorrows('user-1').subscribe(borrows => {
        expect(borrows.length).toBe(1);
        expect(borrows[0].userId).toBe('user-1');
        expect(borrows[0].status).toBe(BorrowStatus.ACTIVE);
        expect(service.borrows().length).toBe(1);
        done();
      });
    });

    it('should filter by userId and ACTIVE status', (done) => {
      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const filtered = [mockTransaction].filter(predicate);
        return of(filtered);
      });

      service.getUserBorrows('user-1').subscribe(borrows => {
        expect(borrows.length).toBe(1);
        expect(borrows.every(b => b.userId === 'user-1' && b.status === BorrowStatus.ACTIVE)).toBe(true);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(throwError(() => new Error('Test error')));

      service.getUserBorrows('user-1').subscribe(borrows => {
        expect(borrows).toEqual([]);
        done();
      });
    });
  });

  describe('getUserBorrowsWithDetails', () => {
    it('should return empty array when no transactions exist', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));

      service.getUserBorrowsWithDetails('user-1').subscribe(details => {
        expect(details).toEqual([]);
        done();
      });
    });

    it('should enrich transactions with book and library details', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([mockTransaction]));
      bookServiceMock.getById.and.returnValue(of(mockBook));
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));

      service.getUserBorrowsWithDetails('user-1').subscribe(details => {
        expect(details.length).toBe(1);
        expect(details[0].bookTitle).toBe('Test Book');
        expect(details[0].bookAuthor).toBe('Test Author');
        expect(details[0].libraryName).toBe('Test Library');
        expect(details[0].userName).toBe('Test User');
        done();
      });
    });

    it('should filter out transactions with null book or library', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([mockTransaction]));
      bookServiceMock.getById.and.returnValue(of(null));
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));

      service.getUserBorrowsWithDetails('user-1').subscribe(details => {
        expect(details.length).toBe(0);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(throwError(() => new Error('Test error')));

      service.getUserBorrowsWithDetails('user-1').subscribe(details => {
        expect(details).toEqual([]);
        done();
      });
    });
  });

  describe('getBookBorrowTransaction', () => {
    it('should return active borrow transaction for a book', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([mockTransaction]));

      service.getBookBorrowTransaction('book-1').subscribe(transaction => {
        expect(transaction).toBeTruthy();
        expect(transaction?.bookId).toBe('book-1');
        expect(transaction?.status).toBe(BorrowStatus.ACTIVE);
        done();
      });
    });

    it('should return null when book is not borrowed', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));

      service.getBookBorrowTransaction('book-1').subscribe(transaction => {
        expect(transaction).toBeNull();
        done();
      });
    });

    it('should return null on error', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(throwError(() => new Error('Test error')));

      service.getBookBorrowTransaction('book-1').subscribe(transaction => {
        expect(transaction).toBeNull();
        done();
      });
    });
  });

  describe('checkCanBorrow', () => {
    it('should allow borrowing when all conditions are met', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([])); // No active borrows
      bookServiceMock.getById.and.returnValue(of(mockBook));

      service.checkCanBorrow('user-1', 'book-1').subscribe(result => {
        expect(result.canBorrow).toBe(true);
        expect(result.reason).toBeUndefined();
        done();
      });
    });

    it('should reject when user has reached max borrowed books (3)', (done) => {
      const threeBorrows = [
        { ...mockTransaction, id: 'txn-1', bookId: 'book-1' },
        { ...mockTransaction, id: 'txn-2', bookId: 'book-2' },
        { ...mockTransaction, id: 'txn-3', bookId: 'book-3' }
      ];

      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        if (predicate(mockTransaction)) {
          return of(threeBorrows);
        }
        return of([]);
      });

      service.checkCanBorrow('user-1', 'book-4').subscribe(result => {
        expect(result.canBorrow).toBe(false);
        expect(result.reason).toContain('already borrowed 3 books');
        done();
      });
    });

    it('should reject when book is already borrowed', (done) => {
      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const testTxn = { ...mockTransaction };
        if (predicate(testTxn) && testTxn.bookId === 'book-1') {
          return of([mockTransaction]);
        }
        return of([]);
      });

      service.checkCanBorrow('user-1', 'book-1').subscribe(result => {
        expect(result.canBorrow).toBe(false);
        expect(result.reason).toContain('currently borrowed by another user');
        done();
      });
    });

    it('should reject when book does not exist', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));
      bookServiceMock.getById.and.returnValue(of(null));

      service.checkCanBorrow('user-1', 'non-existent').subscribe(result => {
        expect(result.canBorrow).toBe(false);
        expect(result.reason).toContain('Book not found');
        done();
      });
    });

    it('should reject when book is not available', (done) => {
      const borrowedBook = { ...mockBook, status: BookStatus.BORROWED };
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));
      bookServiceMock.getById.and.returnValue(of(borrowedBook));

      service.checkCanBorrow('user-1', 'book-1').subscribe(result => {
        expect(result.canBorrow).toBe(false);
        expect(result.reason).toContain('not available for borrowing');
        done();
      });
    });

    it('should handle errors gracefully', (done) => {
      // Mock the service methods directly to throw errors
      spyOn(service, 'getUserBorrows').and.returnValue(throwError(() => new Error('Test error')));
      spyOn(service, 'getBookBorrowTransaction').and.returnValue(of(null));
      bookServiceMock.getById.and.returnValue(of(mockBook));

      service.checkCanBorrow('user-1', 'book-1').subscribe(result => {
        expect(result.canBorrow).toBe(false);
        expect(result.reason).toContain('error occurred');
        done();
      });
    });
  });

  describe('borrowBook', () => {
    it('should create borrow transaction and update book status', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([])); // No active borrows
      bookServiceMock.getById.and.returnValue(of(mockBook));
      (datastoreMock.create as jasmine.Spy).and.returnValue(of(mockTransaction));
      bookServiceMock.updateStatus.and.returnValue(of({ ...mockBook, status: BookStatus.BORROWED }));

      const dto = {
        userId: 'user-1',
        bookId: 'book-1',
        libraryId: 'lib-1'
      };

      service.borrowBook(dto).subscribe(transaction => {
        expect(transaction).toBeTruthy();
        expect(datastoreMock.create).toHaveBeenCalledWith('BorrowTransaction', jasmine.objectContaining({
          bookId: 'book-1',
          userId: 'user-1',
          libraryId: 'lib-1',
          status: BorrowStatus.ACTIVE
        }));
        expect(bookServiceMock.updateStatus).toHaveBeenCalledWith('book-1', BookStatus.BORROWED);
        done();
      });
    });

    it('should set due date to 14 days from now', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));
      bookServiceMock.getById.and.returnValue(of(mockBook));
      (datastoreMock.create.and.callFake as any)((entityType: string, data: any) => {
        expect(data.dueDate).toBeTruthy();
        const daysDiff = Math.floor((data.dueDate.getTime() - data.borrowedAt.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBe(14);
        return of(mockTransaction);
      });
      bookServiceMock.updateStatus.and.returnValue(of({ ...mockBook, status: BookStatus.BORROWED }));

      const dto = {
        userId: 'user-1',
        bookId: 'book-1',
        libraryId: 'lib-1'
      };

      service.borrowBook(dto).subscribe(() => {
        done();
      });
    });

    it('should reject when checkCanBorrow fails', (done) => {
      const threeBorrows = [
        { ...mockTransaction, id: 'txn-1' },
        { ...mockTransaction, id: 'txn-2' },
        { ...mockTransaction, id: 'txn-3' }
      ];

      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        if (predicate(mockTransaction)) {
          return of(threeBorrows);
        }
        return of([]);
      });

      const dto = {
        userId: 'user-1',
        bookId: 'book-4',
        libraryId: 'lib-1'
      };

      service.borrowBook(dto).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('already borrowed 3 books');
          expect(datastoreMock.create).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should update signal with new transaction', (done) => {
      (datastoreMock.query as jasmine.Spy).and.returnValue(of([]));
      bookServiceMock.getById.and.returnValue(of(mockBook));
      (datastoreMock.create as jasmine.Spy).and.returnValue(of(mockTransaction));
      bookServiceMock.updateStatus.and.returnValue(of({ ...mockBook, status: BookStatus.BORROWED }));

      const dto = {
        userId: 'user-1',
        bookId: 'book-1',
        libraryId: 'lib-1'
      };

      service.borrowBook(dto).subscribe(() => {
        expect(service.borrows().length).toBe(1);
        done();
      });
    });
  });

  describe('returnBook', () => {
    it('should update transaction status and book status', (done) => {
      const returnedTransaction = { ...mockTransaction, status: BorrowStatus.RETURNED, returnedAt: new Date() };

      (datastoreMock.read as jasmine.Spy).and.returnValue(of(mockTransaction));
      (datastoreMock.update as jasmine.Spy).and.returnValue(of(returnedTransaction));
      bookServiceMock.updateStatus.and.returnValue(of({ ...mockBook, status: BookStatus.AVAILABLE }));

      service.returnBook('txn-1').subscribe(transaction => {
        expect(transaction.status).toBe(BorrowStatus.RETURNED);
        expect(transaction.returnedAt).toBeTruthy();
        expect(datastoreMock.update).toHaveBeenCalledWith('BorrowTransaction', 'txn-1', jasmine.objectContaining({
          status: BorrowStatus.RETURNED,
          returnedAt: jasmine.any(Date)
        }));
        expect(bookServiceMock.updateStatus).toHaveBeenCalledWith('book-1', BookStatus.AVAILABLE);
        done();
      });
    });

    it('should throw error when transaction not found', (done) => {
      (datastoreMock.read as jasmine.Spy).and.returnValue(of(null));

      service.returnBook('non-existent').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Transaction not found');
          done();
        }
      });
    });

    it('should throw error when book already returned', (done) => {
      const returnedTransaction = { ...mockTransaction, status: BorrowStatus.RETURNED };

      (datastoreMock.read as jasmine.Spy).and.returnValue(of(returnedTransaction));

      service.returnBook('txn-1').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('already been returned');
          done();
        }
      });
    });

    it('should remove transaction from signal cache', (done) => {
      const returnedTransaction = { ...mockTransaction, status: BorrowStatus.RETURNED, returnedAt: new Date() };

      (datastoreMock.query as jasmine.Spy).and.returnValue(of([mockTransaction]));
      (datastoreMock.read as jasmine.Spy).and.returnValue(of(mockTransaction));
      (datastoreMock.update as jasmine.Spy).and.returnValue(of(returnedTransaction));
      bookServiceMock.updateStatus.and.returnValue(of({ ...mockBook, status: BookStatus.AVAILABLE }));

      // First load user borrows
      service.getUserBorrows('user-1').subscribe(() => {
        expect(service.borrows().length).toBe(1);

        // Then return the book
        service.returnBook('txn-1').subscribe(() => {
          expect(service.borrows().length).toBe(0);
          done();
        });
      });
    });
  });

  describe('isOverdue', () => {
    it('should return true when book is overdue', () => {
      const overdueTransaction: BorrowTransaction = {
        ...mockTransaction,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      expect(service.isOverdue(overdueTransaction)).toBe(true);
    });

    it('should return false when book is not overdue', () => {
      const notOverdueTransaction: BorrowTransaction = {
        ...mockTransaction,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };

      expect(service.isOverdue(notOverdueTransaction)).toBe(false);
    });

    it('should return false when transaction is returned', () => {
      const returnedTransaction: BorrowTransaction = {
        ...mockTransaction,
        status: BorrowStatus.RETURNED,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      expect(service.isOverdue(returnedTransaction)).toBe(false);
    });

    it('should return false when dueDate is not set', () => {
      const noDueDateTransaction: BorrowTransaction = {
        ...mockTransaction,
        dueDate: undefined
      };

      expect(service.isOverdue(noDueDateTransaction)).toBe(false);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return positive days for future due date', () => {
      const futureTransaction: BorrowTransaction = {
        ...mockTransaction,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };

      const days = service.getDaysRemaining(futureTransaction);
      expect(days).toBeGreaterThanOrEqual(6); // Account for timing
      expect(days).toBeLessThanOrEqual(8);
    });

    it('should return negative days for overdue book', () => {
      const overdueTransaction: BorrowTransaction = {
        ...mockTransaction,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      };

      const days = service.getDaysRemaining(overdueTransaction);
      expect(days).toBeLessThan(0);
    });

    it('should return null when dueDate is not set', () => {
      const noDueDateTransaction: BorrowTransaction = {
        ...mockTransaction,
        dueDate: undefined
      };

      expect(service.getDaysRemaining(noDueDateTransaction)).toBeNull();
    });
  });
});
