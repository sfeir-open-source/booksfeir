import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Google Books API Response Types
 */
export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
    };
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

/**
 * Simplified book result for UI
 */
export interface GoogleBookResult {
  googleBooksId: string;
  title: string;
  author: string;
  publisher?: string;
  publicationDate?: string;
  description?: string;
  isbn?: string;
  coverImage?: string;
}

/**
 * GoogleBooksService
 *
 * Service for searching books via Google Books API.
 *
 * Features:
 * - Search books by query string
 * - Transform API response to app-friendly format
 * - Extract ISBN from industry identifiers
 * - Handle API errors gracefully
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleBooksService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://www.googleapis.com/books/v1/volumes';

  /**
   * Search for books using Google Books API
   * @param query Search query (title, author, ISBN, etc.)
   * @param maxResults Maximum number of results (default: 20)
   */
  search(query: string, maxResults: number = 20): Observable<GoogleBookResult[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    const params = {
      q: query.trim(),
      maxResults: maxResults.toString()
    };

    return this.http.get<GoogleBooksResponse>(this.API_URL, { params }).pipe(
      map(response => this.transformResponse(response)),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Transform Google Books API response to simplified format
   */
  private transformResponse(response: GoogleBooksResponse): GoogleBookResult[] {
    if (!response.items || response.items.length === 0) {
      return [];
    }

    return response.items.map(volume => this.transformVolume(volume));
  }

  /**
   * Transform a single Google Books volume to app format
   */
  private transformVolume(volume: GoogleBooksVolume): GoogleBookResult {
    const info = volume.volumeInfo;

    return {
      googleBooksId: volume.id,
      title: info.title || 'Unknown Title',
      author: this.extractAuthors(info.authors),
      publisher: info.publisher,
      publicationDate: this.formatPublicationDate(info.publishedDate),
      description: info.description,
      isbn: this.extractISBN(info.industryIdentifiers),
      coverImage: this.extractCoverImage(info.imageLinks)
    };
  }

  /**
   * Extract primary author from authors array
   */
  private extractAuthors(authors?: string[]): string {
    if (!authors || authors.length === 0) {
      return 'Unknown Author';
    }

    // Return first author, or join multiple authors
    return authors.length === 1 ? authors[0] : authors.join(', ');
  }

  /**
   * Extract ISBN from industry identifiers
   * Prefers ISBN_13, falls back to ISBN_10
   */
  private extractISBN(identifiers?: Array<{ type: string; identifier: string }>): string | undefined {
    if (!identifiers || identifiers.length === 0) {
      return undefined;
    }

    // Try to find ISBN_13 first
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) {
      return isbn13.identifier;
    }

    // Fall back to ISBN_10
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) {
      return isbn10.identifier;
    }

    return undefined;
  }

  /**
   * Format publication date to standard format
   * Handles YYYY, YYYY-MM, and YYYY-MM-DD formats
   */
  private formatPublicationDate(date?: string): string | undefined {
    if (!date) {
      return undefined;
    }

    // Return as-is if already in a valid format
    return date;
  }

  /**
   * Extract cover image URL
   * Prefers thumbnail over smallThumbnail
   */
  private extractCoverImage(imageLinks?: { smallThumbnail?: string; thumbnail?: string }): string | undefined {
    if (!imageLinks) {
      return undefined;
    }

    // Prefer thumbnail, fall back to smallThumbnail
    return imageLinks.thumbnail || imageLinks.smallThumbnail;
  }
}
