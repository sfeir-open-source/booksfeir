# Data Model

**Feature**: Library Management Homepage
**Date**: 2025-11-12
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the TypeScript interfaces for all data entities in the Booksfeir library management system. All interfaces follow TypeScript strict mode requirements and align with the feature specification clarifications.

---

## Core Entities

### Library

Represents a collection of books that can be managed by users.

```typescript
export interface Library {
  id: string;                    // Unique identifier (UUID or Datastore key)
  name: string;                  // Required: Display name of the library
  description?: string;          // Optional: Purpose/focus of the library collection
  location?: string;             // Optional: Physical or organizational location
  createdAt: Date;               // Timestamp of creation
  updatedAt: Date;               // Timestamp of last modification
  createdBy: string;             // User ID who created the library
}
```

**Validation Rules**:
- `name`: Required, 1-200 characters, trimmed
- `description`: Optional, max 500 characters
- `location`: Optional, max 200 characters
- `id`: System-generated, immutable
- `createdAt`, `updatedAt`: System-managed
- `createdBy`: Set from authenticated user context

**State Transitions**:
- Created → Active (default state)
- Active → Deleted (only if no borrowed books exist - FR-017)

**Business Rules** (from spec clarifications):
- Cannot be deleted if it contains borrowed books (C-003)
- Must have at least a name to be valid

---

### Book

Represents a physical or digital book that belongs to a library.

```typescript
export interface Book {
  id: string;                    // Unique identifier
  libraryId: string;             // Foreign key to owning library

  // Required fields (C-002)
  title: string;                 // Required: Book title
  author: string;                // Required: Primary author name

  // Optional fields (C-002)
  edition?: string;              // Optional: Edition information (e.g., "2nd Edition")
  publicationDate?: string;      // Optional: ISO date string (YYYY or YYYY-MM-DD)
  isbn?: string;                 // Optional: ISBN-10 or ISBN-13
  coverImage?: string;           // Optional: URL or data URI

  // Status tracking
  status: BookStatus;            // Current availability status
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  addedBy: string;               // User ID who added the book
}

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',       // Book can be borrowed
  BORROWED = 'BORROWED',         // Book is currently borrowed
  UNAVAILABLE = 'UNAVAILABLE'    // Book temporarily unavailable (maintenance, etc.)
}
```

**Validation Rules**:
- `title`: Required, 1-500 characters, trimmed
- `author`: Required, 1-200 characters, trimmed
- `edition`: Optional, max 100 characters
- `publicationDate`: Optional, valid ISO date format (YYYY or YYYY-MM-DD)
- `isbn`: Optional, 10 or 13 digits (may include hyphens)
- `coverImage`: Optional, valid URL or data URI format
- `libraryId`: Required, must reference existing library
- `status`: Required, defaults to `AVAILABLE`

**State Transitions**:
```
AVAILABLE → BORROWED  (when user borrows book)
BORROWED → AVAILABLE  (when user returns book)
* → UNAVAILABLE       (admin action)
UNAVAILABLE → AVAILABLE (admin action)
```

**Business Rules**:
- Cannot be borrowed if status is not `AVAILABLE`
- Status changes to `BORROWED` when borrow transaction created
- Status changes to `AVAILABLE` when book returned to original library
- Book can be deleted regardless of status (returns fail if book deleted)

---

### BorrowTransaction

Represents the borrowing of a book by a user.

```typescript
export interface BorrowTransaction {
  id: string;                    // Unique identifier
  bookId: string;                // Foreign key to borrowed book
  userId: string;                // Foreign key to user who borrowed
  libraryId: string;             // Foreign key to original library (for return)

  status: BorrowStatus;          // Current transaction status
  borrowedAt: Date;              // Timestamp when book was borrowed
  returnedAt?: Date;             // Timestamp when book was returned (null if active)
  dueDate?: Date;                // Optional: When book should be returned
}

export enum BorrowStatus {
  ACTIVE = 'ACTIVE',             // Book currently borrowed
  RETURNED = 'RETURNED',         // Book returned successfully
  OVERDUE = 'OVERDUE'            // Book past due date (future enhancement)
}
```

**Validation Rules**:
- `bookId`: Required, must reference existing book
- `userId`: Required, must reference existing user
- `libraryId`: Required, must match book's original library
- `borrowedAt`: System-set at transaction creation
- `returnedAt`: Null until return action, then system-set
- `status`: Required, defaults to `ACTIVE`

**State Transitions**:
```
ACTIVE → RETURNED  (when user returns book)
ACTIVE → OVERDUE   (when current date > dueDate, if implemented)
```

**Business Rules**:
- One active transaction per book (can't borrow borrowed book)
- Must return to `libraryId` (original library)
- Book status synced: ACTIVE → book.status = BORROWED
- Book status synced: RETURNED → book.status = AVAILABLE
- User can have multiple active transactions (borrow multiple books)

---

### PurchaseRequest

Represents a user's request to purchase a book found via Google Books API.

```typescript
export interface PurchaseRequest {
  id: string;                    // Unique identifier
  userId: string;                // Foreign key to requesting user
  libraryId: string;             // Target library for the book

  // Book information from Google Books API
  title: string;                 // Book title from API
  author: string;                // Primary author from API
  edition?: string;              // Edition info from API
  publicationDate?: string;      // Publication date from API
  isbn?: string;                 // ISBN from API
  coverImage?: string;           // Cover image URL from API
  googleBooksId?: string;        // Google Books volume ID for reference

  // Request tracking
  status: PurchaseRequestStatus;
  requestedAt: Date;             // Timestamp of request creation
  reviewedAt?: Date;             // Timestamp of admin review
  reviewedBy?: string;           // Admin user ID who reviewed
  reviewNotes?: string;          // Admin notes on decision
}

export enum PurchaseRequestStatus {
  PENDING = 'PENDING',           // Awaiting admin review
  APPROVED = 'APPROVED',         // Admin approved purchase
  REJECTED = 'REJECTED',         // Admin rejected purchase
  PURCHASED = 'PURCHASED'        // Book purchased and added to library
}
```

**Validation Rules**:
- `title`, `author`: Required (from Google Books API)
- `userId`, `libraryId`: Required, must reference existing entities
- `status`: Required, defaults to `PENDING`
- `requestedAt`: System-set at creation
- `reviewedAt`, `reviewedBy`: Set when admin takes action
- `googleBooksId`: Optional, for traceability to API source

**State Transitions**:
```
PENDING → APPROVED   (admin approves)
PENDING → REJECTED   (admin rejects)
APPROVED → PURCHASED (admin confirms book added to library)
```

**Business Rules** (from spec clarification C-005):
- Created when user clicks "Request Purchase" on Google Books result
- Requires admin review before book is added to library
- One request per (googleBooksId, libraryId) pair to prevent duplicates
- When PURCHASED, book added to target library with requester credit

**MVP Scope Note**: Admin approval UI is out of scope for this feature. The entity and status transitions are defined for future implementation. For MVP, purchase requests are created but not acted upon.

---

### User

Represents an application user (authenticated via GCP Identity Federation).

```typescript
export interface User {
  id: string;                    // Unique identifier (from auth provider)
  name: string;                  // Display name
  email: string;                 // Email address (from auth provider)
  avatar?: string;               // Profile picture URL or data URI
  role: UserRole;                // User role for permissions
  createdAt: Date;               // Account creation timestamp
  lastLoginAt: Date;             // Last login timestamp
}

export enum UserRole {
  USER = 'USER',                 // Standard user (borrow books, request purchases)
  ADMIN = 'ADMIN',               // Admin (manage libraries, review purchase requests)
  LIBRARIAN = 'LIBRARIAN'        // Librarian (manage specific libraries)
}
```

**Validation Rules**:
- `id`: System-generated from auth provider, immutable
- `name`: Required, 1-100 characters
- `email`: Required, valid email format
- `avatar`: Optional, valid URL or data URI
- `role`: Required, defaults to `USER`

**Business Rules**:
- User data synced from GCP Identity Federation on login
- `lastLoginAt` updated on each authentication
- Role determines permissions (not enforced in MVP, prepared for future)

**MVP Scope**: Mock service provides single hard-coded user. Role-based permissions not enforced.

---

## Type Guards

Type guards for runtime type checking (TypeScript strict mode requirement).

```typescript
export function isLibrary(obj: unknown): obj is Library {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj && typeof (obj as Library).id === 'string' &&
    'name' in obj && typeof (obj as Library).name === 'string';
}

export function isBook(obj: unknown): obj is Book {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj && typeof (obj as Book).id === 'string' &&
    'title' in obj && typeof (obj as Book).title === 'string' &&
    'author' in obj && typeof (obj as Book).author === 'string' &&
    'status' in obj && typeof (obj as Book).status === 'string';
}

export function isBorrowTransaction(obj: unknown): obj is BorrowTransaction {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj && typeof (obj as BorrowTransaction).id === 'string' &&
    'bookId' in obj && typeof (obj as BorrowTransaction).bookId === 'string' &&
    'userId' in obj && typeof (obj as BorrowTransaction).userId === 'string' &&
    'status' in obj && typeof (obj as BorrowTransaction).status === 'string';
}
```

---

## DTO (Data Transfer Objects)

### Google Books API Response

Interface for Google Books API volumes response (external API contract).

```typescript
export interface GoogleBooksVolume {
  kind: string;                  // "books#volume"
  id: string;                    // Google Books volume ID
  volumeInfo: {
    title: string;
    authors?: string[];          // Array of author names
    publisher?: string;
    publishedDate?: string;      // ISO date string (various formats)
    description?: string;
    industryIdentifiers?: Array<{
      type: string;              // "ISBN_10" or "ISBN_13"
      identifier: string;        // ISBN value
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;   // URL to small thumbnail
      thumbnail?: string;        // URL to thumbnail (preferred)
    };
    language?: string;
  };
}

export interface GoogleBooksResponse {
  kind: string;                  // "books#volumes"
  totalItems: number;            // Total matching volumes
  items?: GoogleBooksVolume[];   // Array of volumes (may be empty)
}
```

**Mapping to Book Model**:
```typescript
export function mapGoogleBookToBook(volume: GoogleBooksVolume, libraryId: string): Partial<Book> {
  const info = volume.volumeInfo;
  const isbn = info.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier;

  return {
    title: info.title,
    author: info.authors?.[0] || 'Unknown Author',
    edition: info.publisher ? `${info.publisher}` : undefined,
    publicationDate: info.publishedDate,
    isbn: isbn,
    coverImage: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail,
    libraryId: libraryId,
    status: BookStatus.AVAILABLE
  };
}
```

---

## Form Models

### LibraryFormValue

```typescript
export interface LibraryFormValue {
  name: string;                  // Required
  description?: string;          // Optional
  location?: string;             // Optional
}
```

### BookFormValue

```typescript
export interface BookFormValue {
  title: string;                 // Required
  author: string;                // Required
  edition?: string;              // Optional
  publicationDate?: string;      // Optional
  isbn?: string;                 // Optional
  coverImage?: string;           // Optional (file upload converted to data URI)
}
```

---

## Relationships

### Entity Relationship Diagram

```
User (1) ──── creates ──── (N) Library
User (1) ──── borrows ──── (N) BorrowTransaction
User (1) ──── requests ──── (N) PurchaseRequest

Library (1) ──── contains ──── (N) Book
Library (1) ──── receives ──── (N) PurchaseRequest

Book (1) ──── has ──── (N) BorrowTransaction
Book (N) ──── belongs to ──── (1) Library

BorrowTransaction (N) ──── references ──── (1) Library (for return)
```

### Foreign Key Constraints (enforced in service layer)

| Child Entity | Foreign Key | Parent Entity | On Delete Behavior |
|--------------|-------------|---------------|-------------------|
| Book | libraryId | Library | CASCADE (delete books when library deleted)* |
| BorrowTransaction | bookId | Book | RESTRICT (cannot delete borrowed books) |
| BorrowTransaction | userId | User | RESTRICT (keep transaction history) |
| BorrowTransaction | libraryId | Library | RESTRICT (cannot delete library with borrows) |
| PurchaseRequest | userId | User | RESTRICT (keep request history) |
| PurchaseRequest | libraryId | Library | RESTRICT (keep requests for deleted libraries) |

*Note: CASCADE only applies if library has no borrowed books (per FR-017)

---

## Indexes (for future GCP Datastore implementation)

```typescript
// Composite indexes for efficient queries
export const DATASTORE_INDEXES = [
  // Find books by library
  { kind: 'Book', properties: ['libraryId', 'title'] },

  // Find available books in a library
  { kind: 'Book', properties: ['libraryId', 'status', 'title'] },

  // Find active borrows for a user
  { kind: 'BorrowTransaction', properties: ['userId', 'status', 'borrowedAt'] },

  // Find active borrows for a book
  { kind: 'BorrowTransaction', properties: ['bookId', 'status'] },

  // Find pending purchase requests for a library
  { kind: 'PurchaseRequest', properties: ['libraryId', 'status', 'requestedAt'] },

  // Find all requests by a user
  { kind: 'PurchaseRequest', properties: ['userId', 'status', 'requestedAt'] }
];
```

---

## Storage Estimates (for scaling planning)

### Entity Size Estimates

| Entity | Avg Size (bytes) | Notes |
|--------|------------------|-------|
| Library | ~500 | Name, description, location, metadata |
| Book | ~1,500 | All fields + cover image URL |
| BorrowTransaction | ~300 | IDs, dates, status |
| PurchaseRequest | ~2,000 | Full book info from Google Books |
| User | ~400 | Name, email, avatar URL |

### Projected Storage (1000 users, 50 libraries, 10 books/library)

- Libraries: 50 × 500 bytes = 25 KB
- Books: 500 × 1,500 bytes = 750 KB
- Active Borrows: ~100 × 300 bytes = 30 KB
- Purchase Requests: ~200 × 2,000 bytes = 400 KB
- Users: 1,000 × 400 bytes = 400 KB

**Total**: ~1.6 MB (negligible for GCP Datastore)

---

## Migration Notes

For future production deployment:

1. **Timestamps**: Convert JavaScript `Date` objects to GCP Datastore timestamp entities
2. **IDs**: Use Datastore auto-generated keys instead of UUIDs
3. **Enums**: Store as strings in Datastore, validate on read
4. **Optional Fields**: Datastore supports sparse properties (undefined values not stored)
5. **Images**: Move from data URIs to Cloud Storage URLs with GCS references

---

## References

- Feature Specification: `specs/001-library-homepage/spec.md`
- Clarifications: Documented in spec, Session 2025-11-12
- Research Decisions: `specs/001-library-homepage/research.md`
- TypeScript Strict Mode: Constitution requirement (v1.3.1)