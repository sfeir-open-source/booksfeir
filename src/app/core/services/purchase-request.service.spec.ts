import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PurchaseRequestService } from './purchase-request.service';
import { DatastoreMockService } from './mock/datastore-mock.service';
import { PurchaseRequest, PurchaseRequestStatus } from '../models/purchase-request.model';
import { of, throwError } from 'rxjs';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;
  let datastoreMock: jasmine.SpyObj<DatastoreMockService>;

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
    const datastoreSpyObj = jasmine.createSpyObj('DatastoreMockService', [
      'list',
      'read',
      'create',
      'update',
      'delete',
      'query'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PurchaseRequestService,
        { provide: DatastoreMockService, useValue: datastoreSpyObj }
      ]
    });

    datastoreMock = TestBed.inject(DatastoreMockService) as jasmine.SpyObj<DatastoreMockService>;

    // Default mock behavior
    datastoreMock.list.and.returnValue(of([]));
    datastoreMock.query.and.returnValue(of([]));

    service = TestBed.inject(PurchaseRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('should create a new purchase request with PENDING status', (done) => {
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

      datastoreMock.create.and.returnValue(of(created));
      datastoreMock.list.and.returnValue(of([created]));

      service.create(dto).subscribe(request => {
        expect(request.status).toBe(PurchaseRequestStatus.PENDING);
        expect(datastoreMock.create).toHaveBeenCalledWith('PurchaseRequest', jasmine.objectContaining({
          libraryId: 'lib-1',
          googleBooksId: 'google-book-1',
          title: 'New Book',
          author: 'New Author',
          userId: 'user-1',
          status: PurchaseRequestStatus.PENDING,
          requestedAt: jasmine.any(Date)
        }));
        done();
      });
    });

    it('should create request with optional fields', (done) => {
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

      datastoreMock.create.and.returnValue(of(created));
      datastoreMock.list.and.returnValue(of([created]));

      service.create(dto).subscribe(request => {
        expect(request.isbn).toBe('978-9876543210');
        expect(request.coverImage).toBe('http://example.com/new.jpg');
        done();
      });
    });

    it('should throw error on create failure', (done) => {
      const dto = {
        libraryId: 'lib-1',
        googleBooksId: 'google-book-1',
        title: 'New Book',
        author: 'New Author',
        userId: 'user-1'
      };

      datastoreMock.create.and.returnValue(throwError(() => new Error('Create failed')));

      service.create(dto).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Create failed');
          done();
        }
      });
    });
  });

  describe('getAll', () => {
    it('should retrieve all purchase requests and update signal', (done) => {
      datastoreMock.list.and.returnValue(of(mockRequests));

      service.getAll().subscribe(requests => {
        expect(requests.length).toBe(2);
        expect(service.purchaseRequests().length).toBe(2);
        expect(datastoreMock.list).toHaveBeenCalledWith('PurchaseRequest');
        done();
      });
    });

    it('should sort requests by requestedAt (newest first)', (done) => {
      const unsorted = [mockRequests[0], mockRequests[1]]; // Jan 15, Jan 20
      datastoreMock.list.and.returnValue(of(unsorted));

      service.getAll().subscribe(requests => {
        expect(requests[0].requestedAt.getTime()).toBeGreaterThan(requests[1].requestedAt.getTime());
        done();
      });
    });

    it('should return empty array on error', (done) => {
      datastoreMock.list.and.returnValue(throwError(() => new Error('Test error')));

      service.getAll().subscribe(requests => {
        expect(requests).toEqual([]);
        done();
      });
    });
  });

  describe('getById', () => {
    it('should retrieve a purchase request by ID', (done) => {
      datastoreMock.read.and.returnValue(of(mockPurchaseRequest));

      service.getById('req-1').subscribe(request => {
        expect(request).toEqual(mockPurchaseRequest);
        expect(datastoreMock.read).toHaveBeenCalledWith('PurchaseRequest', 'req-1');
        done();
      });
    });

    it('should return null when request not found', (done) => {
      datastoreMock.read.and.returnValue(of(null));

      service.getById('non-existent').subscribe(request => {
        expect(request).toBeNull();
        done();
      });
    });
  });

  describe('getByLibrary', () => {
    it('should retrieve requests for a specific library', (done) => {
      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.getByLibrary('lib-1').subscribe(requests => {
        expect(requests.length).toBe(2);
        expect(requests.every(r => r.libraryId === 'lib-1')).toBe(true);
        done();
      });
    });

    it('should sort library requests by requestedAt (newest first)', (done) => {
      datastoreMock.query.and.returnValue(of([mockRequests[0], mockRequests[1]]));

      service.getByLibrary('lib-1').subscribe(requests => {
        expect(requests[0].requestedAt.getTime()).toBeGreaterThan(requests[1].requestedAt.getTime());
        done();
      });
    });

    it('should return empty array on error', (done) => {
      datastoreMock.query.and.returnValue(throwError(() => new Error('Test error')));

      service.getByLibrary('lib-1').subscribe(requests => {
        expect(requests).toEqual([]);
        done();
      });
    });
  });

  describe('getByStatus', () => {
    it('should retrieve requests by PENDING status', (done) => {
      const pendingRequests = mockRequests.filter(r => r.status === PurchaseRequestStatus.PENDING);
      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.getByStatus(PurchaseRequestStatus.PENDING).subscribe(requests => {
        expect(requests.length).toBe(1);
        expect(requests[0].status).toBe(PurchaseRequestStatus.PENDING);
        done();
      });
    });

    it('should retrieve requests by APPROVED status', (done) => {
      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.getByStatus(PurchaseRequestStatus.APPROVED).subscribe(requests => {
        expect(requests.length).toBe(1);
        expect(requests[0].status).toBe(PurchaseRequestStatus.APPROVED);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      datastoreMock.query.and.returnValue(throwError(() => new Error('Test error')));

      service.getByStatus(PurchaseRequestStatus.PENDING).subscribe(requests => {
        expect(requests).toEqual([]);
        done();
      });
    });
  });

  describe('checkDuplicate', () => {
    it('should return true when duplicate pending request exists', (done) => {
      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const filtered = mockRequests.filter(predicate);
        return of(filtered);
      });

      service.checkDuplicate('google-book-1', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(true);
        done();
      });
    });

    it('should return false when no duplicate exists', (done) => {
      datastoreMock.query.and.returnValue(of([]));

      service.checkDuplicate('google-book-999', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(false);
        done();
      });
    });

    it('should only consider PENDING status as duplicates', (done) => {
      const approvedRequest = { ...mockPurchaseRequest, status: PurchaseRequestStatus.APPROVED };

      (datastoreMock.query.and.callFake as any)((entityType: string, predicate: any) => {
        const filtered = [approvedRequest].filter(predicate);
        return of(filtered);
      });

      service.checkDuplicate('google-book-1', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(false);
        done();
      });
    });

    it('should return false on error', (done) => {
      datastoreMock.query.and.returnValue(throwError(() => new Error('Test error')));

      service.checkDuplicate('google-book-1', 'lib-1').subscribe(isDuplicate => {
        expect(isDuplicate).toBe(false);
        done();
      });
    });
  });

  describe('updateStatus', () => {
    it('should update request status to APPROVED', (done) => {
      const updated: PurchaseRequest = {
        ...mockPurchaseRequest,
        status: PurchaseRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: 'admin-1'
      };

      datastoreMock.update.and.returnValue(of(updated));
      datastoreMock.list.and.returnValue(of([updated]));

      service.updateStatus('req-1', PurchaseRequestStatus.APPROVED, 'admin-1').subscribe(request => {
        expect(request.status).toBe(PurchaseRequestStatus.APPROVED);
        expect(datastoreMock.update).toHaveBeenCalledWith('PurchaseRequest', 'req-1', jasmine.objectContaining({
          status: PurchaseRequestStatus.APPROVED,
          reviewedAt: jasmine.any(Date),
          reviewedBy: 'admin-1'
        }));
        done();
      });
    });

    it('should update request status to REJECTED with notes', (done) => {
      const updated: PurchaseRequest = {
        ...mockPurchaseRequest,
        status: PurchaseRequestStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: 'admin-1',
        reviewNotes: 'Already have this book'
      };

      datastoreMock.update.and.returnValue(of(updated));
      datastoreMock.list.and.returnValue(of([updated]));

      service.updateStatus('req-1', PurchaseRequestStatus.REJECTED, 'admin-1', 'Already have this book')
        .subscribe(request => {
          expect(request.status).toBe(PurchaseRequestStatus.REJECTED);
          expect(request.reviewNotes).toBe('Already have this book');
          done();
        });
    });

    it('should throw error on update failure', (done) => {
      datastoreMock.update.and.returnValue(throwError(() => new Error('Update failed')));

      service.updateStatus('req-1', PurchaseRequestStatus.APPROVED, 'admin-1').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Update failed');
          done();
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete a purchase request', (done) => {
      datastoreMock.delete.and.returnValue(of(void 0));
      datastoreMock.list.and.returnValue(of([]));

      service.delete('req-1').subscribe(() => {
        expect(datastoreMock.delete).toHaveBeenCalledWith('PurchaseRequest', 'req-1');
        done();
      });
    });

    it('should throw error on delete failure', (done) => {
      datastoreMock.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      service.delete('req-1').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Delete failed');
          done();
        }
      });
    });
  });
});
