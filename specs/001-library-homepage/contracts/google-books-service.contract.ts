/**
 * Google Books Service Contract
 *
 * Defines the interface for integrating with Google Books API v1.
 * Implementation: GoogleBooksService using HttpClient
 */

import { Observable } from 'rxjs';
import { Book } from '../data-model';

export interface GoogleBooksService {
  /**
   * Search Google Books API and return top 5 most recent books
   *
   * Business Rules (FR-010, FR-011, FR-012, C-004):
   * - Queries Google Books API volumes endpoint
   * - Returns maximum 5 results
   * - Sorted by publication date (most recent first)
   * - Silent failure: returns empty array on API error
   * - Maps Google Books volume to internal Book model (partial)
   *
   * API Query:
   * GET https://www.googleapis.com/books/v1/volumes?q={query}&orderBy=newest&maxResults=5
   *
   * @param query - Search query string (user input)
   * @param libraryId - Target library ID for mapping (used in book creation)
   * @returns Observable of book suggestions (max 5)
   * @emits Array of Partial<Book> objects (0-5 items), missing id/status/timestamps
   * @errors Never throws (silent failure per C-004), returns empty array on:
   *   - Network errors
   *   - API unavailable
   *   - API errors (4xx, 5xx)
   *   - Invalid response format
   */
  search(query: string, libraryId: string): Observable<Partial<Book>[]>;

  /**
   * Get detailed information for a specific Google Books volume
   *
   * Used when user wants more info about a search result
   *
   * API Query:
   * GET https://www.googleapis.com/books/v1/volumes/{volumeId}
   *
   * @param volumeId - Google Books volume ID
   * @param libraryId - Target library ID for mapping
   * @returns Observable of book details
   * @emits Partial<Book> object or null if not found
   * @errors Never throws (returns null on error)
   */
  getVolumeById(volumeId: string, libraryId: string): Observable<Partial<Book> | null>;
}

/**
 * Google Books API Response Types (for internal mapping)
 *
 * These match the actual API response structure from Google Books API v1
 */

export interface GoogleBooksVolume {
  kind: string;  // "books#volume"
  id: string;    // Google Books volume ID
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;  // Format varies: "YYYY" or "YYYY-MM-DD"
    description?: string;
    industryIdentifiers?: Array<{
      type: string;          // "ISBN_10" or "ISBN_13"
      identifier: string;    // ISBN value
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;  // URL
      thumbnail?: string;       // URL (preferred)
    };
    language?: string;
  };
}

export interface GoogleBooksResponse {
  kind: string;              // "books#volumes"
  totalItems: number;        // Total matching items
  items?: GoogleBooksVolume[]; // Array of volumes (may be undefined if no results)
}

/**
 * Mapping Helpers
 */

export interface GoogleBooksMapper {
  /**
   * Map Google Books volume to internal Book model
   *
   * Mapping Rules:
   * - title: Direct map from volumeInfo.title
   * - author: First author from volumeInfo.authors[], or "Unknown Author" if missing
   * - edition: volumeInfo.publisher (best approximation)
   * - publicationDate: Direct map from volumeInfo.publishedDate
   * - isbn: Prefer ISBN_13, fall back to ISBN_10
   * - coverImage: Prefer volumeInfo.imageLinks.thumbnail, fall back to smallThumbnail
   * - status: Set to AVAILABLE (not yet added to library)
   * - libraryId: Provided as parameter
   * - id, createdAt, updatedAt, addedBy: Not set (generated on book creation)
   *
   * @param volume - Google Books volume response object
   * @param libraryId - Target library ID
   * @returns Partial Book object ready for display/creation
   */
  mapToBook(volume: GoogleBooksVolume, libraryId: string): Partial<Book>;
}