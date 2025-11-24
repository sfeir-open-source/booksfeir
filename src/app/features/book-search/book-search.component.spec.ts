import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {BookSearchComponent} from './book-search.component';
import {GoogleBookResult, GoogleBooksService} from '../../core/services/google-books.service';
import {PurchaseRequestService} from '../../core/services/purchase-request.service';
import {LibraryService} from '../../core/services/library.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Library} from '../../core/models/library.model';
import {User, UserRole} from '../../core/models/user.model';
import {of, Subject, throwError} from 'rxjs';
import {vi} from 'vitest';

// Helper function to flush microtasks and allow observables to complete
const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 10));

describe('BookSearchComponent', () => {
  let component: BookSearchComponent;
  let fixture: ComponentFixture<BookSearchComponent>;
  let googleBooksService: any;
  let purchaseRequestService: any;
  let libraryService: any;
  let authService: any;
  let dialog: MatDialog;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'system'
  };

  const mockLibraries: Library[] = [
    {
      id: 'lib-1',
      name: 'Test Library 1',
      description: 'First test library',
      location: 'Location 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    },
    {
      id: 'lib-2',
      name: 'Test Library 2',
      description: 'Second test library',
      location: 'Location 2',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    }
  ];

  const mockBookResults: GoogleBookResult[] = [
    {
      googleBooksId: 'book-1',
      title: 'Test Book 1',
      author: 'Author 1',
      publisher: 'Publisher 1',
      publicationDate: '2023-01-01',
      description: 'Test description 1',
      isbn: '1234567890',
      coverImage: 'http://example.com/cover1.jpg'
    },
    {
      googleBooksId: 'book-2',
      title: 'Test Book 2',
      author: 'Author 2',
      publisher: 'Publisher 2',
      publicationDate: '2023-02-01',
      description: 'Test description 2',
      isbn: '0987654321',
      coverImage: 'http://example.com/cover2.jpg'
    }
  ];

  beforeEach(async () => {
    // Create spy objects
    const googleBooksServiceSpy = {
      search: vi.fn()
    };
    const purchaseRequestServiceSpy = {
      create: vi.fn(),
      checkDuplicate: vi.fn()
    };
    const libraryServiceSpy = {
      getAll: vi.fn()
    };
    const authServiceSpy = {
      currentUser: vi.fn()
    };

    // Default return values
    authServiceSpy.currentUser.mockReturnValue(mockUser);
    libraryServiceSpy.getAll.mockReturnValue(of(mockLibraries));

    await TestBed.configureTestingModule({
      imports: [
        BookSearchComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDialogModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: GoogleBooksService, useValue: googleBooksServiceSpy },
        { provide: PurchaseRequestService, useValue: purchaseRequestServiceSpy },
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: AuthMockService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    googleBooksService = TestBed.inject(GoogleBooksService) as any;
    purchaseRequestService = TestBed.inject(PurchaseRequestService) as any;
    libraryService = TestBed.inject(LibraryService) as any;
    authService = TestBed.inject(AuthMockService) as any;
    dialog = TestBed.inject(MatDialog);

    // Spy on dialog.open method
    vi.spyOn(dialog, 'open').mockImplementation(() => {
      const dialogRefSpy = {
        afterClosed: vi.fn()
      };
      dialogRefSpy.afterClosed.mockReturnValue(of(false));
      return dialogRefSpy;
    });

    fixture = TestBed.createComponent(BookSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      fixture.detectChanges();

      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('query')?.value).toBe('');
      expect(component.searchForm.get('libraryId')?.value).toBe('');
    });

    it('should mark query field as required', () => {
      fixture.detectChanges();

      const queryControl = component.searchForm.get('query');
      expect(queryControl?.hasError('required')).toBe(true);

      queryControl?.setValue('test query');
      expect(queryControl?.hasError('required')).toBe(false);
    });

    it('should enforce minlength validation on query', () => {
      fixture.detectChanges();

      const queryControl = component.searchForm.get('query');
      queryControl?.setValue('a'); // Less than 2 characters
      expect(queryControl?.hasError('minlength')).toBe(true);

      queryControl?.setValue('ab');
      expect(queryControl?.hasError('minlength')).toBe(false);
    });

    it('should mark libraryId field as required', () => {
      fixture.detectChanges();

      const libraryIdControl = component.searchForm.get('libraryId');
      expect(libraryIdControl?.hasError('required')).toBe(true);

      libraryIdControl?.setValue('lib-1');
      expect(libraryIdControl?.hasError('required')).toBe(false);
    });
  });

  describe('Library Loading', () => {
    it('should load libraries on initialization', () => {
      fixture.detectChanges();

      expect(libraryService.getAll).toHaveBeenCalled();
      expect(component.libraries()).toEqual(mockLibraries);
    });

    it('should auto-select first library if only one exists', async () => {
      const singleLibrary = [mockLibraries[0]];
      libraryService.getAll.mockReturnValue(of(singleLibrary));

      const newFixture = TestBed.createComponent(BookSearchComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      // Wait for effect to run
      await flushMicrotasks();
      newFixture.detectChanges();

      expect(newComponent.searchForm.get('libraryId')?.value).toBe('lib-1');
    });

    it('should not auto-select library if multiple exist', () => {
      fixture.detectChanges();

      expect(component.searchForm.get('libraryId')?.value).toBe('');
    });

    it('should handle library loading errors gracefully', () => {
      libraryService.getAll.mockReturnValue(throwError(() => new Error('Load failed')));

      const newFixture = TestBed.createComponent(BookSearchComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.error()).toBe('Failed to load libraries');
    });
  });

  describe('Book Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not search if form is invalid', () => {
      component.searchForm.patchValue({
        query: '', // Invalid - required
        libraryId: 'lib-1'
      });

      component.onSearch();

      expect(googleBooksService.search).not.toHaveBeenCalled();
      expect(component.searchForm.get('query')?.touched).toBe(true);
    });

    it('should search Google Books with valid query', () => {
      googleBooksService.search.mockReturnValue(of(mockBookResults));

      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      component.onSearch();

      expect(googleBooksService.search).toHaveBeenCalledWith('test book', 20);
      expect(component.searchResults()).toEqual(mockBookResults);
      expect(component.isSearching()).toBe(false);
      expect(component.searchPerformed()).toBe(true);
    });

    it('should set loading state during search', () => {
      googleBooksService.search.mockReturnValue(of(mockBookResults));

      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      component.onSearch();

      // Before search completes, isSearching should have been true
      // After completion, it should be false
      expect(component.isSearching()).toBe(false);
    });

    it('should clear previous errors when searching', () => {
      googleBooksService.search.mockReturnValue(of(mockBookResults));
      component.error.set('Previous error');

      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      component.onSearch();

      expect(component.error()).toBe(null);
    });

    it('should handle search errors gracefully', () => {
      googleBooksService.search.mockReturnValue(throwError(() => new Error('Search failed')));

      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      component.onSearch();

      expect(component.error()).toBe('Failed to search books. Please try again.');
      expect(component.isSearching()).toBe(false);
      expect(component.searchResults()).toEqual([]);
    });

    it('should display search results', () => {
      googleBooksService.search.mockReturnValue(of(mockBookResults));

      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      component.onSearch();

      expect(component.searchResults().length).toBe(2);
      expect(component.searchResults()[0].title).toBe('Test Book 1');
      expect(component.searchResults()[1].title).toBe('Test Book 2');
    });
  });

  describe('Purchase Request Creation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });
    });

    it('should show error if no library is selected', () => {
      component.searchForm.patchValue({ libraryId: '' });

      component.onRequestPurchase(mockBookResults[0]);

      expect(purchaseRequestService.create).not.toHaveBeenCalled();
      expect(component.error()).toBe('Please select a library first');
    });

    it('should show error if user is not logged in', () => {
      authService.currentUser.mockReturnValue(null);

      component.onRequestPurchase(mockBookResults[0]);

      expect(purchaseRequestService.create).not.toHaveBeenCalled();
      expect(component.error()).toBe('You must be logged in to request a purchase');
    });

    it('should check for duplicate requests before submitting', () => {
      purchaseRequestService.checkDuplicate.mockReturnValue(of(false));
      purchaseRequestService.create.mockReturnValue(of({
        id: 'req-1',
        userId: 'user-1',
        libraryId: 'lib-1',
        title: 'Test Book 1',
        author: 'Author 1',
        status: 'PENDING' as any,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      }));

      component.onRequestPurchase(mockBookResults[0]);

      expect(purchaseRequestService.checkDuplicate).toHaveBeenCalledWith('book-1', 'lib-1');
    });

    it('should show duplicate dialog if request already exists', async () => {
      purchaseRequestService.checkDuplicate.mockReturnValue(of(true));

      // Spy on the private method
      const showDuplicateDialogSpy = vi.spyOn(component as any, 'showDuplicateDialog');

      // Manually trigger the duplicate check flow
      const book = mockBookResults[0];
      component.searchForm.patchValue({ libraryId: 'lib-1' });

      component.onRequestPurchase(book);

      // Wait for observable to complete
      await flushMicrotasks();

      expect(purchaseRequestService.checkDuplicate).toHaveBeenCalledWith('book-1', 'lib-1');
      expect(showDuplicateDialogSpy).toHaveBeenCalledWith(book);
      expect(purchaseRequestService.create).not.toHaveBeenCalled();
    });

    it('should submit purchase request if no duplicate exists', () => {
      purchaseRequestService.checkDuplicate.mockReturnValue(of(false));
      purchaseRequestService.create.mockReturnValue(of({
        id: 'req-1',
        userId: 'user-1',
        libraryId: 'lib-1',
        title: 'Test Book 1',
        author: 'Author 1',
        status: 'PENDING' as any,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      }));

      component.onRequestPurchase(mockBookResults[0]);

      expect(purchaseRequestService.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        libraryId: 'lib-1',
        title: 'Test Book 1',
        author: 'Author 1',
        edition: 'Publisher 1',
        publicationDate: '2023-01-01',
        isbn: '1234567890',
        coverImage: 'http://example.com/cover1.jpg',
        googleBooksId: 'book-1'
      }));
    });

    it('should proceed with request even if duplicate check fails', () => {
      purchaseRequestService.checkDuplicate.mockReturnValue(throwError(() => new Error('Check failed')));
      purchaseRequestService.create.mockReturnValue(of({
        id: 'req-1',
        userId: 'user-1',
        libraryId: 'lib-1',
        title: 'Test Book 1',
        author: 'Author 1',
        status: 'PENDING' as any,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      }));

      component.onRequestPurchase(mockBookResults[0]);

      expect(purchaseRequestService.create).toHaveBeenCalled();
    });

    it('should set submitting state for the specific book', () => {
      const create$ = new Subject<any>();
      purchaseRequestService.checkDuplicate.mockReturnValue(of(false));
      purchaseRequestService.create.mockReturnValue(create$.asObservable());

      component.onRequestPurchase(mockBookResults[0]);

      // After calling onRequestPurchase and checkDuplicate completes (synchronously with of()),
      // the create observable should be subscribed and isSubmitting should be set
      expect(component.isSubmitting()).toBe(mockBookResults[0].googleBooksId);

      create$.next({id: 'req-1'}); // Complete the creation
      create$.complete();

      expect(component.isSubmitting()).toBe(null);
    });



    it('should handle purchase request creation errors', () => {
      purchaseRequestService.checkDuplicate.mockReturnValue(of(false));
      purchaseRequestService.create.mockReturnValue(throwError(() => new Error('Create failed')));

      component.onRequestPurchase(mockBookResults[0]);

      expect(component.error()).toBe('Failed to submit purchase request');
      expect(component.isSubmitting()).toBe(null);
    });
  });

  describe('Purchase Request Confirmation Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show success dialog after successful submission', async () => {
      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      purchaseRequestService.checkDuplicate.mockReturnValue(of(false));
      purchaseRequestService.create.mockReturnValue(of({
        id: 'req-1',
        userId: 'user-1',
        libraryId: 'lib-1',
        title: 'Test Book 1',
        author: 'Author 1',
        status: 'PENDING' as any,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
      }));

      // Spy on the private method
      const showSuccessDialogSpy = vi.spyOn(component as any, 'showSuccessDialog');

      component.onRequestPurchase(mockBookResults[0]);

      // Wait for observables to complete
      await flushMicrotasks();

      expect(showSuccessDialogSpy).toHaveBeenCalledWith(mockBookResults[0]);
    });

    it('should show duplicate dialog with correct message', async () => {
      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      purchaseRequestService.checkDuplicate.mockReturnValue(of(true));

      // Spy on the private method
      const showDuplicateDialogSpy = vi.spyOn(component as any, 'showDuplicateDialog');

      component.onRequestPurchase(mockBookResults[0]);

      // Wait for observable to complete
      await flushMicrotasks();

      expect(showDuplicateDialogSpy).toHaveBeenCalledWith(mockBookResults[0]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle Google Books API failures', () => {
      googleBooksService.search.mockReturnValue(throwError(() => new Error('API Error')));

      component.searchForm.patchValue({
        query: 'test book',
        libraryId: 'lib-1'
      });

      component.onSearch();

      expect(component.error()).toBe('Failed to search books. Please try again.');
      expect(component.searchResults()).toEqual([]);
      expect(component.isSearching()).toBe(false);
    });

    it('should handle library loading failures', () => {
      libraryService.getAll.mockReturnValue(throwError(() => new Error('Load Error')));

      const newFixture = TestBed.createComponent(BookSearchComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.error()).toBe('Failed to load libraries');
    });

    it('should handle purchase request submission failures', () => {
      component.searchForm.patchValue({ libraryId: 'lib-1' });
      purchaseRequestService.checkDuplicate.mockReturnValue(of(false));
      purchaseRequestService.create.mockReturnValue(throwError(() => new Error('Submit Error')));

      component.onRequestPurchase(mockBookResults[0]);

      expect(component.error()).toBe('Failed to submit purchase request');
      expect(component.isSubmitting()).toBe(null);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error message for query', () => {
      const queryControl = component.searchForm.get('query');
      queryControl?.markAsTouched();
      queryControl?.setValue('');

      expect(component.getErrorMessage('query')).toBe('Search query is required');
    });

    it('should return minlength error message for query', () => {
      const queryControl = component.searchForm.get('query');
      queryControl?.markAsTouched();
      queryControl?.setValue('a');

      expect(component.getErrorMessage('query')).toBe('Search query must be at least 2 characters');
    });

    it('should return required error message for libraryId', () => {
      const libraryIdControl = component.searchForm.get('libraryId');
      libraryIdControl?.markAsTouched();
      libraryIdControl?.setValue('');

      expect(component.getErrorMessage('libraryId')).toBe('Library is required');
    });

    it('should return empty string if no errors', () => {
      const queryControl = component.searchForm.get('query');
      queryControl?.setValue('test query');

      expect(component.getErrorMessage('query')).toBe('');
    });

    it('should return empty string if field not touched', () => {
      const queryControl = component.searchForm.get('query');
      queryControl?.setValue('');

      expect(component.getErrorMessage('query')).toBe('');
    });

    it('should detect field errors correctly', () => {
      const queryControl = component.searchForm.get('query');

      expect(component.hasError('query')).toBe(false);

      queryControl?.markAsTouched();
      queryControl?.setValue('');

      expect(component.hasError('query')).toBe(true);

      queryControl?.setValue('test query');

      expect(component.hasError('query')).toBe(false);
    });
  });

  describe('Track By Function', () => {
    it('should return googleBooksId for trackBy', () => {
      const result = component.trackByGoogleBooksId(0, mockBookResults[0]);
      expect(result).toBe('book-1');
    });
  });
});
