import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, WritableSignal, signal } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { LibraryDetailComponent } from './library-detail.component';
import { LibraryService } from '../../core/services/library.service';
import { BookService } from '../../core/services/book.service';
import { BorrowService } from '../../core/services/borrow.service';
import { AuthMockService } from '../../core/services/mock/auth-mock.service';
import { Library } from '../../core/models/library.model';
import { Book, BookStatus } from '../../core/models/book.model';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

describe('LibraryDetailComponent', () => {
  let component: LibraryDetailComponent;
  let fixture: ComponentFixture<LibraryDetailComponent>;
  let libraryServiceMock: jasmine.SpyObj<LibraryService>;
  let bookServiceMock: jasmine.SpyObj<BookService>;
  let borrowServiceMock: jasmine.SpyObj<BorrowService>;
  let authServiceMock: jasmine.SpyObj<AuthMockService>;
  let dialogMock: jasmine.SpyObj<MatDialog>;
  let router: Router;
  let librariesSignal: WritableSignal<Library[]>;
  let booksSignal: WritableSignal<Book[]>;

  const mockLibrary: Library = {
    id: 'lib-1',
    name: 'Central Library',
    description: 'Main library in downtown',
    location: 'Downtown',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1'
  };

  const mockBooks: Book[] = [
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
      addedBy: 'user-1'
    }
  ];

  beforeEach(async () => {
    const libraryServiceSpy = jasmine.createSpyObj('LibraryService', ['getById', 'canDelete', 'delete']);
    const bookServiceSpy = jasmine.createSpyObj('BookService', ['getByLibrary', 'delete']);
    const borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['getBookBorrowTransaction', 'borrowBook', 'returnBook']);
    const authServiceSpy = jasmine.createSpyObj('AuthMockService', ['currentUser']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Create writable signals for testing
    librariesSignal = signal<Library[]>([]);
    booksSignal = signal<Book[]>([]);

    Object.defineProperty(libraryServiceSpy, 'libraries', {
      get: () => librariesSignal.asReadonly()
    });
    Object.defineProperty(bookServiceSpy, 'books', {
      get: () => booksSignal.asReadonly()
    });

    authServiceSpy.currentUser.and.returnValue({
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg'
    });

    // Set default return value for getBookBorrowTransaction
    borrowServiceSpy.getBookBorrowTransaction.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [LibraryDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: BookService, useValue: bookServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: AuthMockService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: jasmine.createSpy('get').and.returnValue('lib-1')
              }
            }
          }
        }
      ]
    }).compileComponents();

    libraryServiceMock = TestBed.inject(LibraryService) as jasmine.SpyObj<LibraryService>;
    bookServiceMock = TestBed.inject(BookService) as jasmine.SpyObj<BookService>;
    borrowServiceMock = TestBed.inject(BorrowService) as jasmine.SpyObj<BorrowService>;
    authServiceMock = TestBed.inject(AuthMockService) as jasmine.SpyObj<AuthMockService>;
    dialogMock = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(LibraryDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should start with loading state true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should load library and books on ngOnInit', () => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of(mockBooks));

      component.ngOnInit();

      expect(libraryServiceMock.getById).toHaveBeenCalledWith('lib-1');
      expect(bookServiceMock.getByLibrary).toHaveBeenCalledWith('lib-1');
    });

    it('should set library and books after successful load', (done) => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of(mockBooks));
      borrowServiceMock.getBookBorrowTransaction.and.returnValue(of(null));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.library()).toEqual(mockLibrary);
        expect(component.books()).toEqual(mockBooks);
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should set loading to false after error', (done) => {
      libraryServiceMock.getById.and.returnValue(throwError(() => new Error('Test error')));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        expect(component.error()).toBeTruthy();
        done();
      }, 10);
    });

    it('should handle missing library ID', () => {
      const activatedRoute = TestBed.inject(ActivatedRoute);
      (activatedRoute.snapshot.paramMap.get as jasmine.Spy).and.returnValue(null);

      component.ngOnInit();

      expect(component.error()).toBe('Library ID is missing');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle library not found', (done) => {
      libraryServiceMock.getById.and.returnValue(of(null));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.error()).toBe('Library not found');
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });
  });

  describe('Library Header', () => {
    beforeEach(() => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of(mockBooks));
      borrowServiceMock.getBookBorrowTransaction.and.returnValue(of(null));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display library name', () => {
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('.library-header h1'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toBe('Central Library');
    });

    it('should display library description when available', () => {
      fixture.detectChanges();
      const description = fixture.debugElement.query(By.css('.library-description'));
      expect(description).toBeTruthy();
      expect(description.nativeElement.textContent).toBe('Main library in downtown');
    });

    it('should display library location when available', () => {
      fixture.detectChanges();
      const location = fixture.debugElement.query(By.css('.library-location'));
      expect(location).toBeTruthy();
      expect(location.nativeElement.textContent).toContain('Downtown');
    });

    it('should have Edit button', () => {
      fixture.detectChanges();
      const buttons = fixture.debugElement.queryAll(By.css('.library-header button'));
      const editButton = buttons.find(b => b.nativeElement.textContent.includes('Edit'));
      expect(editButton).toBeTruthy();
    });

    it('should have Delete button', () => {
      fixture.detectChanges();
      const buttons = fixture.debugElement.queryAll(By.css('.library-header button'));
      const deleteButton = buttons.find(b => b.nativeElement.textContent.includes('Delete'));
      expect(deleteButton).toBeTruthy();
    });
  });

  describe('Books Display', () => {
    beforeEach(() => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of(mockBooks));
      borrowServiceMock.getBookBorrowTransaction.and.returnValue(of(null));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display books section header', () => {
      const header = fixture.debugElement.query(By.css('.section-title h2'));
      expect(header).toBeTruthy();
      expect(header.nativeElement.textContent).toBe('Books');
    });

    it('should display book count', () => {
      const bookCount = fixture.debugElement.query(By.css('.book-count'));
      expect(bookCount).toBeTruthy();
      expect(bookCount.nativeElement.textContent).toContain('2 books');
    });

    it('should have Add Book button', () => {
      const addButton = fixture.debugElement.query(By.css('.section-header button'));
      expect(addButton).toBeTruthy();
      expect(addButton.nativeElement.textContent).toContain('Add Book');
    });
  });

  describe('Loading State', () => {
    it('should display loading container when loading', () => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of([]));
      fixture.detectChanges(); // Trigger ngOnInit
      component.isLoading.set(true); // Set loading to true after init
      fixture.detectChanges(); // Re-render with loading state

      const loadingContainer = fixture.debugElement.query(By.css('.loading-container'));
      expect(loadingContainer).toBeTruthy();
    });

    it('should display loading message when loading', () => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of([]));
      fixture.detectChanges();
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingText = fixture.debugElement.query(By.css('.loading-container p'));
      expect(loadingText).toBeTruthy();
      expect(loadingText.nativeElement.textContent).toBe('Loading library...');
    });

    it('should hide loading when library loaded', (done) => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of(mockBooks));
      borrowServiceMock.getBookBorrowTransaction.and.returnValue(of(null));
      component.ngOnInit();

      setTimeout(() => {
        fixture.detectChanges();
        const spinner = fixture.debugElement.query(By.css('.loading-container mat-spinner'));
        expect(spinner).toBeFalsy();
        done();
      }, 20);
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', (done) => {
      libraryServiceMock.getById.and.returnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      setTimeout(() => {
        fixture.detectChanges();
        const errorState = fixture.debugElement.query(By.css('.error-state'));
        expect(errorState).toBeTruthy();
        done();
      }, 10);
    });

    it('should display error icon', (done) => {
      libraryServiceMock.getById.and.returnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      setTimeout(() => {
        fixture.detectChanges();
        const errorIcon = fixture.debugElement.query(By.css('.error-icon'));
        expect(errorIcon).toBeTruthy();
        done();
      }, 10);
    });

    it('should have return button on error', (done) => {
      libraryServiceMock.getById.and.returnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      setTimeout(() => {
        fixture.detectChanges();
        const returnButton = fixture.debugElement.query(By.css('.error-state button'));
        expect(returnButton).toBeTruthy();
        expect(returnButton.nativeElement.textContent).toContain('Return to Homepage');
        done();
      }, 10);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(of(mockBooks));
    });

    it('should have back button', () => {
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('.back-button-container button'));
      expect(backButton).toBeTruthy();
      expect(backButton.nativeElement.textContent).toContain('Back to Libraries');
    });

    it('should navigate to home on back button click', () => {
      spyOn(router, 'navigate');
      fixture.detectChanges();

      component.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to edit page on edit button click', () => {
      spyOn(router, 'navigate');
      component.library.set(mockLibrary);

      component.onEdit();

      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1', 'edit']);
    });

    it('should navigate to add book page', () => {
      spyOn(router, 'navigate');
      component.library.set(mockLibrary);

      component.onAddBook();

      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1', 'book', 'new']);
    });
  });

  describe('Track By Function', () => {
    it('should return book id for track by', () => {
      const book = mockBooks[0];
      const result = component.trackByBookId(0, book);

      expect(result).toBe('book-1');
    });

    it('should return different ids for different books', () => {
      const result1 = component.trackByBookId(0, mockBooks[0]);
      const result2 = component.trackByBookId(1, mockBooks[1]);

      expect(result1).not.toBe(result2);
      expect(result1).toBe('book-1');
      expect(result2).toBe('book-2');
    });
  });

  describe('Status Display', () => {
    it('should format status for display', () => {
      expect(component.getStatusDisplay('AVAILABLE')).toBe('Available');
      expect(component.getStatusDisplay('BORROWED')).toBe('Borrowed');
      expect(component.getStatusDisplay('UNAVAILABLE')).toBe('Unavailable');
    });

    it('should return correct color for status', () => {
      expect(component.getStatusColor('AVAILABLE')).toBe('primary');
      expect(component.getStatusColor('BORROWED')).toBe('accent');
      expect(component.getStatusColor('UNAVAILABLE')).toBe('warn');
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      const metadata = (component.constructor as any).__annotations__?.[0];
      expect(metadata?.changeDetection).toBe(0); // OnPush = 0
    });
  });

  describe('Error Handling', () => {
    it('should handle library load error gracefully', (done) => {
      libraryServiceMock.getById.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');

      component.ngOnInit();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading library:', jasmine.any(Error));
        expect(component.error()).toBe('Failed to load library');
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should handle books load error gracefully', (done) => {
      libraryServiceMock.getById.and.returnValue(of(mockLibrary));
      bookServiceMock.getByLibrary.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');

      component.ngOnInit();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading books:', jasmine.any(Error));
        expect(component.error()).toBe('Failed to load books');
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });
  });
});
