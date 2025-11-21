import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection, signal, WritableSignal} from '@angular/core';
import {provideRouter, Router} from '@angular/router';
import {Location} from '@angular/common';
import {By} from '@angular/platform-browser';
import {of} from 'rxjs';

import {HomeComponent} from './home.component';
import {LibraryDetailComponent} from '../library-detail/library-detail.component';
import {LibraryService} from '../../core/services/library.service';
import {BookService} from '../../core/services/book.service';
import {BorrowService} from '../../core/services/borrow.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Library} from '../../core/models/library.model';
import {Book, BookStatus} from '../../core/models/book.model';
import {MatDialog} from '@angular/material/dialog';
import {vi} from 'vitest';

describe('User Story 1 - View and Navigate Library Collection (Integration)', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let location: Location;
  let libraryServiceMock: any;
  let bookServiceMock: any;
  let borrowServiceMock: any;
  let authServiceMock: any;
  let dialogMock: any;
  let librariesSignal: WritableSignal<Library[]>;
  let booksSignal: WritableSignal<Book[]>;

  const mockLibraries: Library[] = [
    {
      id: 'lib-1',
      name: 'Central Library',
      description: 'Main library in downtown',
      location: 'Downtown',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user-1'
    },
    {
      id: 'lib-2',
      name: 'Tech Hub Library',
      description: 'Technology and innovation books',
      location: 'Tech District',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      createdBy: 'user-1'
    }
  ];

  const mockBooksLib1: Book[] = [
    {
      id: 'book-1',
      libraryId: 'lib-1',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      edition: '1st',
      publicationDate: '2008-08-01',
      isbn: '978-0132350884',
      coverImage: 'https://example.com/clean-code.jpg',
      status: BookStatus.AVAILABLE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      addedBy: 'user-1'
    },
    {
      id: 'book-2',
      libraryId: 'lib-1',
      title: 'Design Patterns',
      author: 'Gang of Four',
      edition: '1st',
      publicationDate: '1994-10-31',
      isbn: '978-0201633610',
      coverImage: 'https://example.com/design-patterns.jpg',
      status: BookStatus.BORROWED,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      addedBy: 'user-1'
    }
  ];

  beforeEach(async () => {
    // Create service mocks
    const libraryServiceSpy = {
      getById: vi.fn(),
      getAll: vi.fn()
    };
    const bookServiceSpy = {
      getByLibrary: vi.fn()
    };
    const borrowServiceSpy = {
      getBookBorrowTransaction: vi.fn()
    };
    const authServiceSpy = {
      currentUser: vi.fn(),
      rigthOfManage: signal(true),
    };
    const dialogSpy = {
      open: vi.fn()
    };

    // Create writable signals for testing
    librariesSignal = signal<Library[]>(mockLibraries);
    booksSignal = signal<Book[]>([]);

    Object.defineProperty(libraryServiceSpy, 'libraries', {
      get: () => librariesSignal.asReadonly()
    });
    Object.defineProperty(bookServiceSpy, 'books', {
      get: () => booksSignal.asReadonly()
    });

    authServiceSpy.currentUser.mockReturnValue({
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg'
    });

    // Set up default mock return values
    libraryServiceSpy.getAll.mockReturnValue(of(mockLibraries));
    libraryServiceSpy.getById.mockReturnValue(of(mockLibraries[0]));
    bookServiceSpy.getByLibrary.mockReturnValue(of(mockBooksLib1));
    borrowServiceSpy.getBookBorrowTransaction.mockReturnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [HomeComponent, LibraryDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', component: HomeComponent },
          { path: 'library/:id', component: LibraryDetailComponent }
        ]),
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: BookService, useValue: bookServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: AuthMockService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    libraryServiceMock = TestBed.inject(LibraryService) as any;
    bookServiceMock = TestBed.inject(BookService) as any;
    borrowServiceMock = TestBed.inject(BorrowService) as any;
    authServiceMock = TestBed.inject(AuthMockService) as any;
    dialogMock = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  describe('Full User Flow', () => {
    it('should load homepage with navigation and library list', async () => {
      await router.navigate(['']);
      fixture = TestBed.createComponent(HomeComponent);
      fixture.detectChanges();

      // Verify we're on the home route
      expect(location.path()).toBe('');

      // Verify libraries are loaded
      expect(libraryServiceMock.getAll).toHaveBeenCalled();

      // Verify library cards are displayed
      const libraryCards = fixture.debugElement.queryAll(By.css('.library-card'));
      expect(libraryCards.length).toBe(2);

      // Verify first library card content
      const firstCard = libraryCards[0];
      expect(firstCard.nativeElement.textContent).toContain('Central Library');
      expect(firstCard.nativeElement.textContent).toContain('Main library in downtown');
      expect(firstCard.nativeElement.textContent).toContain('Downtown');
    });

    it('should navigate to library detail when clicking a library card', async () => {
      await router.navigate(['']);
      fixture = TestBed.createComponent(HomeComponent);
      fixture.detectChanges();

      // Find and click the first library card
      const libraryCards = fixture.debugElement.queryAll(By.css('.library-card'));
      expect(libraryCards.length).toBeGreaterThan(0);

      const firstCard = libraryCards[0];
      firstCard.nativeElement.click();
      await fixture.whenStable();

      // Verify navigation occurred
      expect(location.path()).toBe('/library/lib-1');
    });

    it('should navigate to library detail route successfully', async () => {
      // Navigate directly to library detail route
      await router.navigate(['/library/lib-1']);
      expect(location.path()).toBe('/library/lib-1');

      // Verify LibraryDetailComponent can be created for this route
      const detailFixture = TestBed.createComponent(LibraryDetailComponent);
      expect(detailFixture.componentInstance).toBeTruthy();

      // Verify component has required services injected
      expect(detailFixture.componentInstance['libraryService']).toBeTruthy();
      expect(detailFixture.componentInstance['bookService']).toBeTruthy();
    });

    it('should complete full navigation flow from home to library detail', async () => {
      // Reset spies for clean test
      libraryServiceMock.getAll.mockClear();

      // Step 1: Load home page
      await router.navigate(['']);
      fixture = TestBed.createComponent(HomeComponent);
      fixture.detectChanges();

      expect(location.path()).toBe('');
      expect(libraryServiceMock.getAll).toHaveBeenCalled();

      // Step 2: Verify libraries are displayed
      const libraryCards = fixture.debugElement.queryAll(By.css('.library-card'));
      expect(libraryCards.length).toBe(2);

      // Step 3: Click first library card
      const firstCard = libraryCards[0];
      firstCard.nativeElement.click();
      await fixture.whenStable();

      // Step 4: Verify successful navigation to library detail
      expect(location.path()).toBe('/library/lib-1');

      // Step 5: Verify detail component can be created
      const detailFixture = TestBed.createComponent(LibraryDetailComponent);
      expect(detailFixture.componentInstance).toBeTruthy();
    });
  });

  describe('Navigation Between Routes', () => {
    it('should maintain service state when navigating back to home', async () => {
      // Navigate to library detail
      await router.navigate(['/library/lib-1']);
      let detailFixture = TestBed.createComponent(LibraryDetailComponent);
      detailFixture.detectChanges();
      await detailFixture.whenStable();

      // Navigate back to home
      await router.navigate(['']);
      fixture = TestBed.createComponent(HomeComponent);
      fixture.detectChanges();

      // Verify libraries are still available
      const libraryCards = fixture.debugElement.queryAll(By.css('.library-card'));
      expect(libraryCards.length).toBe(2);
    });

    it('should handle navigation to different library routes', async () => {
      // Navigate to first library
      await router.navigate(['/library/lib-1']);
      expect(location.path()).toBe('/library/lib-1');

      // Navigate to second library
      await router.navigate(['/library/lib-2']);
      expect(location.path()).toBe('/library/lib-2');

      // Verify router can navigate between different library routes
      expect(location.path()).toContain('/library/');
    });
  });

  describe('Service Integration', () => {
    it('should load libraries from LibraryService on home page', async () => {
      await router.navigate(['']);
      fixture = TestBed.createComponent(HomeComponent);
      fixture.detectChanges();

      expect(libraryServiceMock.getAll).toHaveBeenCalled();

      const component = fixture.componentInstance;
      expect(component.libraries().length).toBe(2);
    });

    it('should properly inject services into components', () => {
      // Verify HomeComponent has LibraryService injected
      const homeFixture = TestBed.createComponent(HomeComponent);
      expect(homeFixture.componentInstance['libraryService']).toBeTruthy();

      // Verify LibraryDetailComponent has all required services
      const detailFixture = TestBed.createComponent(LibraryDetailComponent);
      expect(detailFixture.componentInstance['libraryService']).toBeTruthy();
      expect(detailFixture.componentInstance['bookService']).toBeTruthy();
      expect(detailFixture.componentInstance['borrowService']).toBeTruthy();
      expect(detailFixture.componentInstance['authService']).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle library not found gracefully', async () => {
      libraryServiceMock.getById.mockReturnValue(of(null));

      await router.navigate(['/library/non-existent']);
      const detailFixture = TestBed.createComponent(LibraryDetailComponent);
      detailFixture.detectChanges();
      await detailFixture.whenStable();
      detailFixture.detectChanges();

      const errorState = detailFixture.debugElement.query(By.css('.error-state'));
      expect(errorState).toBeTruthy();
    });

    it('should display empty state when no libraries exist', async () => {
      librariesSignal.set([]);
      libraryServiceMock.getAll.mockReturnValue(of([]));

      await router.navigate(['']);
      fixture = TestBed.createComponent(HomeComponent);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No Libraries Yet');
    });
  });
});
