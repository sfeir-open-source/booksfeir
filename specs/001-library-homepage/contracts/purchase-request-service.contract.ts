/**
 * Purchase Request Service Contract
 *
 * Defines the interface for managing book purchase requests.
 * Business Rule (C-005): Users can request purchase of books found via Google Books API
 *
 * MVP Scope: Create and list requests only. Admin approval UI out of scope.
 * Implementations: DatastoreMockService (dev), DatastoreGcpService (prod)
 */

import { Observable } from 'rxjs';
import { PurchaseRequest, PurchaseRequestStatus } from '../data-model';

export interface PurchaseRequestService {
  /**
   * Create a new purchase request from Google Books result
   *
   * Business Rules:
   * - One request per (googleBooksId, libraryId) pair to prevent duplicates
   * - Initial status: PENDING
   * - Captures all book information from Google Books API
   * - Links to requesting user and target library
   *
   * @param request - Purchase request data (from Google Books result)
   * @returns Observable of created purchase request
   * @emits Created PurchaseRequest with id, timestamps, status=PENDING
   * @errors Throws if duplicate request exists (same googleBooksId + libraryId)
   * @errorMessage "Purchase request already exists for this book in this library"
   */
  create(request: CreatePurchaseRequestDto): Observable<PurchaseRequest>;

  /**
   * Get all purchase requests for a library
   *
   * Used for admin review (future enhancement)
   *
   * @param libraryId - Library unique identifier
   * @param status - Optional filter by status
   * @returns Observable of purchase requests
   * @emits Array of PurchaseRequest objects, sorted by requestedAt desc
   * @errors Never throws (returns empty array on error)
   */
  getByLibrary(libraryId: string, status?: PurchaseRequestStatus): Observable<PurchaseRequest[]>;

  /**
   * Get all purchase requests by a user
   *
   * Used to show user their request history
   *
   * @param userId - User unique identifier
   * @param status - Optional filter by status
   * @returns Observable of purchase requests
   * @emits Array of PurchaseRequest objects, sorted by requestedAt desc
   * @errors Never throws (returns empty array on error)
   */
  getByUser(userId: string, status?: PurchaseRequestStatus): Observable<PurchaseRequest[]>;

  /**
   * Get a single purchase request by ID
   *
   * @param id - PurchaseRequest unique identifier
   * @returns Observable of purchase request or null
   * @emits PurchaseRequest object or null if not found
   * @errors Never throws (returns null on error)
   */
  getById(id: string): Observable<PurchaseRequest | null>;

  /**
   * Update purchase request status (admin action)
   *
   * MVP Scope: This method defined for future admin UI
   * Not implemented in current feature
   *
   * @param id - PurchaseRequest unique identifier
   * @param status - New status (APPROVED, REJECTED, PURCHASED)
   * @param reviewNotes - Optional admin notes
   * @param reviewedBy - Admin user ID
   * @returns Observable of updated purchase request
   * @emits Updated PurchaseRequest with reviewedAt, reviewedBy, reviewNotes set
   * @errors Throws if request not found or invalid status transition
   */
  updateStatus(
    id: string,
    status: PurchaseRequestStatus,
    reviewNotes?: string,
    reviewedBy?: string
  ): Observable<PurchaseRequest>;

  /**
   * Check if a purchase request already exists
   *
   * Prevents duplicate requests for same book in same library
   *
   * @param googleBooksId - Google Books volume ID
   * @param libraryId - Library unique identifier
   * @returns Observable of boolean
   * @emits true if request exists (any status), false otherwise
   * @errors Never throws (returns false on error)
   */
  exists(googleBooksId: string, libraryId: string): Observable<boolean>;

  /**
   * Delete a purchase request
   *
   * Only allowed for PENDING requests by the requesting user or admin
   *
   * @param id - PurchaseRequest unique identifier
   * @returns Observable of void on success
   * @emits void
   * @errors Throws if request not found or cannot be deleted
   */
  delete(id: string): Observable<void>;
}

/**
 * DTO for creating a purchase request
 */
export interface CreatePurchaseRequestDto {
  userId: string;              // From auth context
  libraryId: string;           // Target library
  title: string;               // From Google Books
  author: string;              // From Google Books
  edition?: string;            // From Google Books
  publicationDate?: string;    // From Google Books
  isbn?: string;               // From Google Books
  coverImage?: string;         // From Google Books
  googleBooksId?: string;      // Google Books volume ID (for deduplication)
}