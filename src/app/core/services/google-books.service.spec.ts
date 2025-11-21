import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {GoogleBooksResponse, GoogleBooksService, GoogleBooksVolume} from './google-books.service';

describe('GoogleBooksService', () => {
  let service: GoogleBooksService;
  let httpMock: HttpTestingController;
  const API_URL = 'https://www.googleapis.com/books/v1/volumes';

  const mockVolume: GoogleBooksVolume = {
    id: 'test-book-id',
    volumeInfo: {
      title: 'Test Book',
      authors: ['Test Author', 'Co-Author'],
      publisher: 'Test Publisher',
      publishedDate: '2020-01-01',
      description: 'A test book description',
      industryIdentifiers: [
        { type: 'ISBN_13', identifier: '9781234567890' },
        { type: 'ISBN_10', identifier: '1234567890' }
      ],
      imageLinks: {
        thumbnail: 'http://example.com/thumbnail.jpg',
        smallThumbnail: 'http://example.com/small.jpg'
      }
    }
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        GoogleBooksService
      ]
    });

    service = TestBed.inject(GoogleBooksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('search', () => {
    it('should return empty array for empty query', () => {
      service.search('').subscribe(results => {
        expect(results).toEqual([]);

      });

      // No HTTP request should be made
      httpMock.expectNone(API_URL);
    });

    it('should return empty array for whitespace query', () => {
      service.search('   ').subscribe(results => {
        expect(results).toEqual([]);

      });

      httpMock.expectNone(API_URL);
    });

    it('should make HTTP GET request with correct parameters', () => {
      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [mockVolume]
      };

      service.search('test query', 10).subscribe();

      const req = httpMock.expectOne(request => {
        return request.url === API_URL &&
          request.params.get('q') === 'test query+subject:Computers' &&
               request.params.get('maxResults') === '10';
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default maxResults of 20 when not specified', () => {
      const mockResponse: GoogleBooksResponse = {
        totalItems: 0,
        items: []
      };

      service.search('test').subscribe(() => {

      });

      const req = httpMock.expectOne(request => {
        return request.params.get('maxResults') === '20';
      });

      expect(req.request.params.get('maxResults')).toBe('20');
      req.flush(mockResponse);
    });

    it('should trim the search query', () => {
      const mockResponse: GoogleBooksResponse = {
        totalItems: 0,
        items: []
      };

      service.search('  spaced query  ').subscribe(() => {

      });

      const req = httpMock.expectOne(request => {
        return request.params.get('q') === 'spaced query+subject:Computers';
      });

      expect(req.request.params.get('q')).toBe('spaced query+subject:Computers');
      req.flush(mockResponse);
    });

    it('should transform API response to app format', () => {
      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [mockVolume]
      };

      service.search('test').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].googleBooksId).toBe('test-book-id');
        expect(results[0].title).toBe('Test Book');
        expect(results[0].author).toBe('Test Author, Co-Author');
        expect(results[0].publisher).toBe('Test Publisher');
        expect(results[0].publicationDate).toBe('2020-01-01');
        expect(results[0].isbn).toBe('9781234567890');
        expect(results[0].coverImage).toBe('http://example.com/thumbnail.jpg');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return empty array when API returns no items', () => {
      const mockResponse: GoogleBooksResponse = {
        totalItems: 0,
        items: []
      };

      service.search('test').subscribe(results => {
        expect(results).toEqual([]);

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return empty array when API returns undefined items', () => {
      const mockResponse: GoogleBooksResponse = {
        totalItems: 0
      };

      service.search('test').subscribe(results => {
        expect(results).toEqual([]);

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should handle API errors silently', () => {
      service.search('test').subscribe(results => {
        expect(results).toEqual([]);

      });

      const req = httpMock.expectOne(() => true);
      req.error(new ProgressEvent('Network error'), {
        status: 500,
        statusText: 'Server Error'
      });
    });

    it('should handle network errors silently', () => {
      service.search('test').subscribe(results => {
        expect(results).toEqual([]);

      });

      const req = httpMock.expectOne(() => true);
      req.error(new ProgressEvent('timeout'));
    });
  });

  describe('author extraction', () => {
    it('should return first author when single author', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          authors: ['Single Author']
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].author).toBe('Single Author');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should join multiple authors', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          authors: ['Author One', 'Author Two', 'Author Three']
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].author).toBe('Author One, Author Two, Author Three');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return "Unknown Author" when no authors', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          authors: undefined
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].author).toBe('Unknown Author');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return "Unknown Author" for empty authors array', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          authors: []
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].author).toBe('Unknown Author');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });
  });

  describe('ISBN extraction', () => {
    it('should prefer ISBN_13 over ISBN_10', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '1234567890' },
            { type: 'ISBN_13', identifier: '9780123456789' }
          ]
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].isbn).toBe('9780123456789');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should use ISBN_10 when ISBN_13 not available', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '1234567890' }
          ]
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].isbn).toBe('1234567890');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return undefined when no ISBN available', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          industryIdentifiers: undefined
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].isbn).toBeUndefined();

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return undefined when identifiers array is empty', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          industryIdentifiers: []
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].isbn).toBeUndefined();

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });
  });

  describe('cover image extraction', () => {
    it('should prefer thumbnail over smallThumbnail', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          imageLinks: {
            thumbnail: 'http://example.com/large.jpg',
            smallThumbnail: 'http://example.com/small.jpg'
          }
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].coverImage).toBe('http://example.com/large.jpg');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should use smallThumbnail when thumbnail not available', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          imageLinks: {
            smallThumbnail: 'http://example.com/small.jpg'
          }
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].coverImage).toBe('http://example.com/small.jpg');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should return undefined when no images available', () => {
      const volume: GoogleBooksVolume = {
        ...mockVolume,
        volumeInfo: {
          ...mockVolume.volumeInfo,
          imageLinks: undefined
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].coverImage).toBeUndefined();

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle missing title', () => {
      const volume: GoogleBooksVolume = {
        id: 'test-id',
        volumeInfo: {
          title: '',
          authors: ['Test Author']
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].title).toBe('Unknown Title');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should handle missing optional fields', () => {
      const volume: GoogleBooksVolume = {
        id: 'test-id',
        volumeInfo: {
          title: 'Minimal Book'
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 1,
        items: [volume]
      };

      service.search('test').subscribe(results => {
        expect(results[0].googleBooksId).toBe('test-id');
        expect(results[0].title).toBe('Minimal Book');
        expect(results[0].author).toBe('Unknown Author');
        expect(results[0].publisher).toBeUndefined();
        expect(results[0].publicationDate).toBeUndefined();
        expect(results[0].isbn).toBeUndefined();
        expect(results[0].coverImage).toBeUndefined();

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });

    it('should handle multiple volumes in response', () => {
      const volume2: GoogleBooksVolume = {
        id: 'test-book-2',
        volumeInfo: {
          title: 'Second Book',
          authors: ['Another Author']
        }
      };

      const mockResponse: GoogleBooksResponse = {
        totalItems: 2,
        items: [mockVolume, volume2]
      };

      service.search('test').subscribe(results => {
        expect(results.length).toBe(2);
        expect(results[0].googleBooksId).toBe('test-book-id');
        expect(results[1].googleBooksId).toBe('test-book-2');

      });

      const req = httpMock.expectOne(() => true);
      req.flush(mockResponse);
    });
  });
});
