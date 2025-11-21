import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {PurchaseRequestService} from './purchase-request.service';
import {DatastoreMockService} from './mock/datastore-mock.service';
import {PurchaseRequest, PurchaseRequestStatus} from '../models/purchase-request.model';
import {of, throwError} from 'rxjs';
import {vi} from 'vitest';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;
  let datastoreMock: any;

  const mockPurchaseRequest: PurchaseRequest = {
    id: 'req-1',
    libraryId: 'lib-1',
    googleBooksId: 'google-book-1',
    title: 'Test Book',
    author: 'Test Author',
    isbn: '978-1234567890',
    coverImage: 'http://example.com/cover.jpg',
    status: PurchaseRequestStatus.PENDING,
    requestedAt: new Date('2024-01-15'),
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRequests: PurchaseRequest[] = [
    mockPurchaseRequest,
    {
      id: 'req-2',
      libraryId: 'lib-1',
      googleBooksId: 'google-book-2',
      title: 'Another Book',
      author: 'Another Author',
      status: PurchaseRequestStatus.APPROVED,
      requestedAt: new Date('2024-01-20'),
      userId: 'user-2',
      reviewedAt: new Date('2024-01-21'),
      reviewedBy: 'admin-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    const datastoreSpyObj = {
      list: vi.fn(),
      read: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      query: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PurchaseRequestService,
        { provide: DatastoreMockService, useValue: datastoreSpyObj }
      ]
    });

    datastoreMock = TestBed.inject(DatastoreMockService) as any;

    // Default mock behavior
    datastoreMock.list.mockReturnValue(of([]));
    datastoreMock.query.mockReturnValue(of([]));

    service = TestBed.inject(PurchaseRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('should create a new purchase request with PENDING status', () => {
      const dto = {
        libraryId: 'lib-1',
        googleBooksId: 'google-book-1',
        title: 'New Book',
        author: 'New Author',
        userId: 'user-1'
      };

      const created: PurchaseRequest = {
        ...dto,
        id: 'new-req',
        status: PurchaseRequestStatus.PENDING,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      datastoreMock.create.mockReturnValue(of(created));
      datastoreMock.list.mockReturnValue(of([created]));

      service.create(dto).subscribe(request => {
        expect(request.status).toBe(PurchaseRequestStatus.PENDING);
        expect(datastoreMock.create).toHaveBeenCalledWith('PurchaseRequest', {
          libraryId: 'lib-1',
          googleBooksId: 'google-book-1',
          title: 'New Book',
          author: 'New Author',
          userId: 'user-1',
          status: PurchaseRequestStatus.PENDING,
          requestedAt: expect.any(Date)
        });

      });
    });

    it('should create request with optional fields', () => {
      const dto = {
        libraryId: 'lib-1',
        googleBooksId: 'google-book-1',
        title: 'New Book',
        author: 'New Author',
        edition: 'New Edition',
        isbn: '978-9876543210',
        coverImage: 'http://example.com/new.jpg',
        userId: 'user-1'
      };

      const created: PurchaseRequest = {
        ...dto,
        id: 'new-req',
        status: PurchaseRequestStatus.PENDING,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      datastoreMock.create.mockReturnValue(of(created));
      datastoreMock.list.mockReturnValue(of([created]));

      service.create(dto).subscribe(request => {
        expect(request.isbn).toBe('978-9876543210');
        expect(request.coverImage).toBe('http://example.com/new.jpg');

      });
    });

    it('should throw error on create failure', () => {
      const dto = {
        libraryId: 'lib-1',
        googleBooksId: 'google-book-1',
        title: 'New Book',
        author: 'New Author',
        userId: 'user-1'
      };

      datastoreMock.create.mockReturnValue(throwError(() => new Error('Create failed')));

      service.create(dto).subscribe({
        error: (error) => {
          expect(error.message).toContain('Create failed');

        }
      });
    });
  });

  describe('getAll', () => {
    it('should retrieve all purchase requests and update signal', () => {
      datastoreMock.list.mockReturnValue(of(mockRequests));

      service.getAll().subscribe(requests => {
        expect(requests.length).toBe(2);
        expect(service.purchaseRequests().length).toBe(2);
        expect(datastoreMock.list).toHaveBeenCalledWith('PurchaseRequest');

      });
    });

    it('should sort requests by requestedAt (newest first)', () => {
      const unsorted = [mockRequests[0], mockRequests[1]]; // Jan 15, Jan 20
      datastoreMock.list.mockReturnValue(of(unsorted));

      service.getAll().subscribe(requests => {
        expect(requests[0].requestedAt.getTime()).toBeGreaterThan(requests[1].requestedAt.getTime());

      });
    });

    it('should return empty array on error', () => {
      datastoreMock.list.mockReturnValue(throwError(() => new Error('Test error')));

      service.getAll().subscribe(requests => {
        expect(requests).toEqual([]);

      });
    });
  });

  describe('getById', () => {
    it('should retrieve a purchase request by ID', () => {
      datastoreMock.read.mockReturnValue(of(mockPurchaseRequest));

      service.getById('req-1').subscribe(request => {
        expect(request).toEqual(mockPurchaseRequest);
        expect(datastoreMock.read).toHaveBeenCalledWith('PurchaseRequest', 'req-1');

      });
    });

    it('should return null when request not found', () => {
      datastoreMock.read.mockReturnValue(of(null));

      service.getById('non-existent').subscribe(request => {
        expect(request).toBeNull();

      });
    });
  });

  describe('getByLibrary', () => {
    it('should retrieve requests for a specific library', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.getByLibrary('lib-1').subscribe(requests => {
        expect(requests.length).toBe(2);
        expect(requests.every(r => r.libraryId === 'lib-1')).toBe(true);

      });
    });

    it('should sort library requests by requestedAt (newest first)', () => {
      datastoreMock.query.mockReturnValue(of([mockRequests[0], mockRequests[1]]));

      service.getByLibrary('lib-1').subscribe(requests => {
        expect(requests[0].requestedAt.getTime()).toBeGreaterThan(requests[1].requestedAt.getTime());

      });
    });

    it('should return empty array on error', () => {
      datastoreMock.query.mockReturnValue(throwError(() => new Error('Test error')));

      service.getByLibrary('lib-1').subscribe(requests => {
        expect(requests).toEqual([]);

      });
    });
  });

  describe('getByStatus', () => {
    it('should retrieve requests by PENDING status', () => {
      const pendingRequests = mockRequests.filter(r => r.status === PurchaseRequestStatus.PENDING);
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.getByStatus(PurchaseRequestStatus.PENDING).subscribe(requests => {
        expect(requests.length).toBe(1);
        expect(requests[0].status).toBe(PurchaseRequestStatus.PENDING);

      });
    });

    it('should retrieve requests by APPROVED status', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.getByStatus(PurchaseRequestStatus.APPROVED).subscribe(requests => {
        expect(requests.length).toBe(1);
        expect(requests[0].status).toBe(PurchaseRequestStatus.APPROVED);

      });
    });

    it('should return empty array on error', () => {
      datastoreMock.query.mockReturnValue(throwError(() => new Error('Test error')));

      service.getByStatus(PurchaseRequestStatus.PENDING).subscribe(requests => {
        expect(requests).toEqual([]);

      });
    });
  });

  describe('checkDuplicate', () => {
    it('should return true when duplicate pending request exists', () => {
      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.checkDuplicate('google-book-1', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(true);

      });
    });

    it('should return false when no duplicate exists', () => {
      datastoreMock.query.mockReturnValue(of([]));

      service.checkDuplicate('google-book-999', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(false);

      });
    });

    it('should only consider PENDING status as duplicates', () => {
      const approvedRequest = { ...mockPurchaseRequest, status: PurchaseRequestStatus.APPROVED };

      datastoreMock.query.mockImplementation((entityType: string, predicate: any) => {
        const filtered = [approvedRequest].filter(predicate);
        return of(filtered);
      });

      service.checkDuplicate('google-book-1', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(false);

      });
    });

    it('should return false on error', () => {
      datastoreMock.query.mockReturnValue(throwError(() => new Error('Test error')));

      service.checkDuplicate('google-book-1', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(false);

      });
    });
  });

  describe('updateStatus', () => {
    it('should update request status to APPROVED', () => {
      const updated: PurchaseRequest = {
        ...mockPurchaseRequest,
        status: PurchaseRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: 'admin-1'
      };

      datastoreMock.update.mockReturnValue(of(updated));
      datastoreMock.list.mockReturnValue(of([updated]));

      service.updateStatus('req-1', PurchaseRequestStatus.APPROVED, 'admin-1').subscribe(request => {
        expect(request.status).toBe(PurchaseRequestStatus.APPROVED);
        expect(datastoreMock.update).toHaveBeenCalledWith('PurchaseRequest', 'req-1', {
          status: PurchaseRequestStatus.APPROVED,
          reviewedAt: expect.any(Date),
          reviewedBy: 'admin-1'
        });

      });
    });

    it('should update request status to REJECTED with notes', () => {
      const updated: PurchaseRequest = {
        ...mockPurchaseRequest,
        status: PurchaseRequestStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: 'admin-1',
        reviewNotes: 'Already have this book'
      };

      datastoreMock.update.mockReturnValue(of(updated));
      datastoreMock.list.mockReturnValue(of([updated]));

      service.updateStatus('req-1', PurchaseRequestStatus.REJECTED, 'admin-1', 'Already have this book')
        .subscribe(request => {
          expect(request.status).toBe(PurchaseRequestStatus.REJECTED);
          expect(request.reviewNotes).toBe('Already have this book');

        });
    });

    it('should throw error on update failure', () => {
      datastoreMock.update.mockReturnValue(throwError(() => new Error('Update failed')));

      service.updateStatus('req-1', PurchaseRequestStatus.APPROVED, 'admin-1').subscribe({
        error: (error) => {
          expect(error.message).toContain('Update failed');

        }
      });
    });
  });

  describe('delete', () => {
    it('should delete a purchase request', () => {
      datastoreMock.delete.mockReturnValue(of(void 0));
      datastoreMock.list.mockReturnValue(of([]));

      service.delete('req-1').subscribe(() => {
        expect(datastoreMock.delete).toHaveBeenCalledWith('PurchaseRequest', 'req-1');

      });
    });

    it('should throw error on delete failure', () => {
      datastoreMock.delete.mockReturnValue(throwError(() => new Error('Delete failed')));

      service.delete('req-1').subscribe({
        error: (error) => {
          expect(error.message).toContain('Delete failed');

        }
      });
    });
  });
});
