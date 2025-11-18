/**
 * PurchaseRequest Model
 *
 * Represents a user's request to purchase a book found via Google Books API.
 * Admin reviews and approves/rejects requests.
 *
 * Business Rules:
 * - One request per (googleBooksId, libraryId) pair to prevent duplicates
 * - Initial status: PENDING
 * - Admin review workflow (approval UI out of MVP scope)
 */

export interface PurchaseRequest {
  id: string;                    // Unique identifier
  userId: string;                // User who made the request
  libraryId: string;             // Target library for the book

  // Book information from Google Books API
  title: string;                 // Book title
  author: string;                // Primary author
  edition?: string;              // Edition/publisher info
  publicationDate?: string;      // Publication date
  isbn?: string;                 // ISBN identifier
  coverImage?: string;           // Cover image URL
  googleBooksId?: string;        // Google Books volume ID (for deduplication)

  // Request tracking
  status: PurchaseRequestStatus; // Current request status
  requestedAt: Date;             // When request was created
  reviewedAt?: Date;             // When admin reviewed (null if pending)
  reviewedBy?: string;           // Admin user ID who reviewed
  reviewNotes?: string;          // Optional admin notes

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Purchase request status
 */
export enum PurchaseRequestStatus {
  PENDING = 'PENDING',           // Awaiting admin review
  APPROVED = 'APPROVED',         // Admin approved purchase
  REJECTED = 'REJECTED',         // Admin rejected request
  PURCHASED = 'PURCHASED'        // Book has been purchased and added to library
}

/**
 * DTO for creating a purchase request from Google Books result
 */
export interface CreatePurchaseRequestDto {
  userId: string;                // From auth context
  libraryId: string;             // Target library
  title: string;                 // From Google Books
  author: string;                // From Google Books
  edition?: string;              // From Google Books
  publicationDate?: string;      // From Google Books
  isbn?: string;                 // From Google Books
  coverImage?: string;           // From Google Books
  googleBooksId?: string;        // Google Books volume ID (for deduplication)
}

/**
 * Type guard to check if an object is a valid PurchaseRequest
 */
export function isPurchaseRequest(obj: unknown): obj is PurchaseRequest {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const req = obj as Record<string, unknown>;
  return (
    typeof req['id'] === 'string' &&
    typeof req['userId'] === 'string' &&
    typeof req['libraryId'] === 'string' &&
    typeof req['title'] === 'string' &&
    typeof req['author'] === 'string' &&
    (req['edition'] === undefined || typeof req['edition'] === 'string') &&
    (req['publicationDate'] === undefined || typeof req['publicationDate'] === 'string') &&
    (req['isbn'] === undefined || typeof req['isbn'] === 'string') &&
    (req['coverImage'] === undefined || typeof req['coverImage'] === 'string') &&
    (req['googleBooksId'] === undefined || typeof req['googleBooksId'] === 'string') &&
    Object.values(PurchaseRequestStatus).includes(req['status'] as PurchaseRequestStatus) &&
    req['requestedAt'] instanceof Date &&
    (req['reviewedAt'] === undefined || req['reviewedAt'] instanceof Date) &&
    (req['reviewedBy'] === undefined || typeof req['reviewedBy'] === 'string') &&
    (req['reviewNotes'] === undefined || typeof req['reviewNotes'] === 'string') &&
    req['createdAt'] instanceof Date &&
    req['updatedAt'] instanceof Date
  );
}
