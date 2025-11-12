import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { DatastoreMockService } from './mock/datastore-mock.service';
import {
  PurchaseRequest,
  PurchaseRequestStatus,
  CreatePurchaseRequestDto
} from '../models/purchase-request.model';

/**
 * PurchaseRequestService
 *
 * Service for managing book purchase requests.
 *
 * Features:
 * - Create purchase requests from Google Books results
 * - List all purchase requests
 * - Filter by status
 * - Check for duplicate requests
 * - Signal-based reactive state
 */
@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {
  private datastore = inject(DatastoreMockService);

  // Signal for reactive state
  private purchaseRequestsSignal = signal<PurchaseRequest[]>([]);
  purchaseRequests = this.purchaseRequestsSignal.asReadonly();

  /**
   * Create a new purchase request
   */
  create(dto: CreatePurchaseRequestDto): Observable<PurchaseRequest> {
    const request: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      ...dto,
      status: PurchaseRequestStatus.PENDING,
      requestedAt: new Date()
    };

    return this.datastore.create<PurchaseRequest>('PurchaseRequest', request).pipe(
      tap(() => this.refreshList()),
      catchError(err => {
        throw err;
      })
    );
  }

  /**
   * Get all purchase requests
   */
  getAll(): Observable<PurchaseRequest[]> {
    return this.datastore.list<PurchaseRequest>('PurchaseRequest').pipe(
      map(requests => this.sortByRequestedAt(requests)),
      tap(requests => this.purchaseRequestsSignal.set(requests)),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Get purchase request by ID
   */
  getById(id: string): Observable<PurchaseRequest | null> {
    return this.datastore.read<PurchaseRequest>('PurchaseRequest', id);
  }

  /**
   * Get purchase requests for a specific library
   */
  getByLibrary(libraryId: string): Observable<PurchaseRequest[]> {
    return this.datastore.query<PurchaseRequest>('PurchaseRequest',
      (request: PurchaseRequest) => request.libraryId === libraryId
    ).pipe(
      map(requests => this.sortByRequestedAt(requests)),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Get purchase requests by status
   */
  getByStatus(status: PurchaseRequestStatus): Observable<PurchaseRequest[]> {
    return this.datastore.query<PurchaseRequest>('PurchaseRequest',
      (request: PurchaseRequest) => request.status === status
    ).pipe(
      map(requests => this.sortByRequestedAt(requests)),
      catchError(err => {
        return of([]);
      })
    );
  }

  /**
   * Check if a purchase request already exists for a Google Books ID and library
   * This prevents duplicate requests
   */
  checkDuplicate(googleBooksId: string, libraryId: string): Observable<boolean> {
    return this.datastore.query<PurchaseRequest>('PurchaseRequest',
      (request: PurchaseRequest) =>
        request.googleBooksId === googleBooksId &&
        request.libraryId === libraryId &&
        request.status === PurchaseRequestStatus.PENDING
    ).pipe(
      map(requests => requests.length > 0),
      catchError(() => of(false))
    );
  }

  /**
   * Update purchase request status (admin action)
   */
  updateStatus(
    id: string,
    status: PurchaseRequestStatus,
    reviewedBy: string,
    reviewNotes?: string
  ): Observable<PurchaseRequest> {
    return this.datastore.update<PurchaseRequest>('PurchaseRequest', id, {
      status,
      reviewedAt: new Date(),
      reviewedBy,
      reviewNotes
    }).pipe(
      tap(() => this.refreshList()),
      catchError(err => {
        throw err;
      })
    );
  }

  /**
   * Delete a purchase request
   */
  delete(id: string): Observable<void> {
    return this.datastore.delete('PurchaseRequest', id).pipe(
      tap(() => this.refreshList()),
      catchError(err => {
        throw err;
      })
    );
  }

  /**
   * Refresh the purchase requests list
   */
  private refreshList(): void {
    this.getAll().subscribe();
  }

  /**
   * Sort purchase requests by requested date (newest first)
   */
  private sortByRequestedAt(requests: PurchaseRequest[]): PurchaseRequest[] {
    return requests.sort((a, b) => {
      return b.requestedAt.getTime() - a.requestedAt.getTime();
    });
  }
}
