import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {ActivatedRoute, provideRouter, Router} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {BookFormComponent} from './book-form.component';
import {BookService} from '../../core/services/book.service';
import {LibraryService} from '../../core/services/library.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Book, BookStatus} from '../../core/models/book.model';
import {Library} from '../../core/models/library.model';
import {User, UserRole} from '../../core/models/user.model';
import {of, throwError} from 'rxjs';

describe('BookFormComponent', () => {
  let component: BookFormComponent;
  let fixture: ComponentFixture<BookFormComponent>;
  let bookService: jasmine.SpyObj<BookService>;
  let libraryService: jasmine.SpyObj<LibraryService>;
  let authService: jasmine.SpyObj<AuthMockService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockUser: User = {
    id: 'mock-user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'system'
  };

  const mockLibrary: Library = {
    id: 'lib-1',
    name: 'Test Library',
    description: 'A test library',
    location: 'Test Location',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'mock-user-1'
  };

  const mockBook: Book = {
    id: 'book-1',
    libraryId: 'lib-1',
    title: 'Test Book',
    author: 'Test Author',
    edition: 'First Edition',
    publicationDate: '2024',
    isbn: '978-0123456789',
    coverImage: 'https://example.com/cover.jpg',
    status: BookStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    addedBy: 'mock-user-1'
  };

  beforeEach(async () => {
    // Create spy objects
    const bookServiceSpy = jasmine.createSpyObj('BookService', [
      'create',
      'update',
      'getById'
    ]);

    const libraryServiceSpy = jasmine.createSpyObj('LibraryService', [
      'getAll'
    ]);

    const authServiceSpy = jasmine.createSpyObj('AuthMockService', ['currentUser']);
    authServiceSpy.currentUser.and.returnValue(mockUser);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        },
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        BookFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: BookService, useValue: bookServiceSpy },
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: AuthMockService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    bookService = TestBed.inject(BookService) as jasmine.SpyObj<BookService>;
    libraryService = TestBed.inject(LibraryService) as jasmine.SpyObj<LibraryService>;
    authService = TestBed.inject(AuthMockService) as jasmine.SpyObj<AuthMockService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Default library service response
    libraryService.getAll.and.returnValue(of([mockLibrary]));

    fixture = TestBed.createComponent(BookFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values in create mode', () => {
      fixture.detectChanges();

      expect(component.form).toBeDefined();
      expect(component.form.get('libraryId')?.value).toBe('');
      expect(component.form.get('title')?.value).toBe('');
      expect(component.form.get('author')?.value).toBe('');
      expect(component.form.get('edition')?.value).toBe('');
      expect(component.form.get('publicationDate')?.value).toBe('');
      expect(component.form.get('isbn')?.value).toBe('');
      expect(component.form.get('coverImage')?.value).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should initialize form with libraryId from query params', () => {
      activatedRoute.snapshot.queryParamMap.get = jasmine.createSpy('get')
        .and.callFake((key: string) => key === 'libraryId' ? 'lib-1' : null);

      fixture.detectChanges();

      expect(component.form.get('libraryId')?.value).toBe('lib-1');
      expect(component.libraryId()).toBe('lib-1');
    });

    it('should mark required fields correctly', () => {
      fixture.detectChanges();

      const libraryIdControl = component.form.get('libraryId');
      const titleControl = component.form.get('title');
      const authorControl = component.form.get('author');

      expect(libraryIdControl?.hasError('required')).toBe(true);
      expect(titleControl?.hasError('required')).toBe(true);
      expect(authorControl?.hasError('required')).toBe(true);

      libraryIdControl?.setValue('lib-1');
      titleControl?.setValue('Test Book');
      authorControl?.setValue('Test Author');

      expect(libraryIdControl?.hasError('required')).toBe(false);
      expect(titleControl?.hasError('required')).toBe(false);
      expect(authorControl?.hasError('required')).toBe(false);
    });

    it('should not require optional fields', () => {
      fixture.detectChanges();

      const editionControl = component.form.get('edition');
      const publicationDateControl = component.form.get('publicationDate');
      const isbnControl = component.form.get('isbn');
      const coverImageControl = component.form.get('coverImage');

      expect(editionControl?.hasError('required')).toBe(false);
      expect(publicationDateControl?.hasError('required')).toBe(false);
      expect(isbnControl?.hasError('required')).toBe(false);
      expect(coverImageControl?.hasError('required')).toBe(false);
    });

    it('should enforce max length validation', () => {
      fixture.detectChanges();

      const titleControl = component.form.get('title');
      titleControl?.setValue('a'.repeat(501)); // Exceeds 500 char limit
      expect(titleControl?.hasError('maxlength')).toBe(true);

      const authorControl = component.form.get('author');
      authorControl?.setValue('a'.repeat(201)); // Exceeds 200 char limit
      expect(authorControl?.hasError('maxlength')).toBe(true);

      const editionControl = component.form.get('edition');
      editionControl?.setValue('a'.repeat(101)); // Exceeds 100 char limit
      expect(editionControl?.hasError('maxlength')).toBe(true);

      const publicationDateControl = component.form.get('publicationDate');
      publicationDateControl?.setValue('a'.repeat(51)); // Exceeds 50 char limit
      expect(publicationDateControl?.hasError('maxlength')).toBe(true);

      const isbnControl = component.form.get('isbn');
      isbnControl?.setValue('a'.repeat(21)); // Exceeds 20 char limit
      expect(isbnControl?.hasError('maxlength')).toBe(true);

      const coverImageControl = component.form.get('coverImage');
      coverImageControl?.setValue('a'.repeat(2001)); // Exceeds 2000 char limit
      expect(coverImageControl?.hasError('maxlength')).toBe(true);
    });

    it('should load libraries on init', () => {
      fixture.detectChanges();

      expect(libraryService.getAll).toHaveBeenCalled();
      expect(component.libraries()).toEqual([mockLibrary]);
    });

    it('should handle library load errors gracefully', () => {
      libraryService.getAll.and.returnValue(throwError(() => new Error('Load failed')));

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load libraries');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('book-1');
      bookService.getById.and.returnValue(of(mockBook));
    });

    it('should load book data in edit mode', () => {
      fixture.detectChanges();

      expect(component.isEditMode()).toBe(true);
      expect(component.bookId()).toBe('book-1');
      expect(bookService.getById).toHaveBeenCalledWith('book-1');
      expect(component.form.get('libraryId')?.value).toBe('lib-1');
      expect(component.form.get('title')?.value).toBe('Test Book');
      expect(component.form.get('author')?.value).toBe('Test Author');
      expect(component.form.get('edition')?.value).toBe('First Edition');
      expect(component.form.get('publicationDate')?.value).toBe('2024');
      expect(component.form.get('isbn')?.value).toBe('978-0123456789');
      expect(component.form.get('coverImage')?.value).toBe('https://example.com/cover.jpg');
    });

    it('should disable library selection in edit mode', () => {
      fixture.detectChanges();

      const libraryIdControl = component.form.get('libraryId');
      expect(libraryIdControl?.disabled).toBe(true);
    });

    it('should handle book with optional fields missing', () => {
      const bookWithoutOptionals: Book = {
        ...mockBook,
        edition: undefined,
        publicationDate: undefined,
        isbn: undefined,
        coverImage: undefined
      };
      bookService.getById.and.returnValue(of(bookWithoutOptionals));

      fixture.detectChanges();

      expect(component.form.get('edition')?.value).toBe('');
      expect(component.form.get('publicationDate')?.value).toBe('');
      expect(component.form.get('isbn')?.value).toBe('');
      expect(component.form.get('coverImage')?.value).toBe('');
    });

    it('should set error when book not found', () => {
      bookService.getById.and.returnValue(of(null));
      fixture.detectChanges();

      expect(component.error()).toBe('Book not found');
    });

    it('should handle load errors gracefully', () => {
      bookService.getById.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load book');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Form Submission - Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', () => {
      component.form.patchValue({
        libraryId: 'lib-1',
        title: '', // Invalid - required
        author: 'Test Author'
      });

      component.onSubmit();

      expect(bookService.create).not.toHaveBeenCalled();
      expect(component.form.get('title')?.touched).toBe(true);
    });

    it('should create book with valid form data', () => {
      const formValue = {
        libraryId: 'lib-1',
        title: 'New Book',
        author: 'New Author',
        edition: 'First Edition',
        publicationDate: '2024',
        isbn: '978-0123456789',
        coverImage: 'https://example.com/cover.jpg'
      };

      const createdBook: Book = {
        ...mockBook,
        ...formValue,
        id: 'new-book-1'
      };

      bookService.create.and.returnValue(of(createdBook));

      component.form.patchValue(formValue);
      component.onSubmit();

      expect(bookService.create).toHaveBeenCalledWith('lib-1', jasmine.objectContaining({
        title: 'New Book',
        author: 'New Author',
        edition: 'First Edition',
        publicationDate: '2024',
        isbn: '978-0123456789',
        coverImage: 'https://example.com/cover.jpg',
        addedBy: 'mock-user-1'
      }));
      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });

    it('should create book with only required fields', () => {
      const formValue = {
        libraryId: 'lib-1',
        title: 'Minimal Book',
        author: 'Minimal Author',
        edition: '',
        publicationDate: '',
        isbn: '',
        coverImage: ''
      };

      const createdBook: Book = {
        ...mockBook,
        title: 'Minimal Book',
        author: 'Minimal Author',
        id: 'new-book-2'
      };

      bookService.create.and.returnValue(of(createdBook));

      component.form.patchValue(formValue);
      component.onSubmit();

      expect(bookService.create).toHaveBeenCalledWith('lib-1', jasmine.objectContaining({
        title: 'Minimal Book',
        author: 'Minimal Author',
        addedBy: 'mock-user-1'
      }));
      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });

    it('should handle create errors gracefully', () => {
      bookService.create.and.returnValue(throwError(() => new Error('Create failed')));

      component.form.patchValue({
        libraryId: 'lib-1',
        title: 'Test Book',
        author: 'Test Author'
      });

      component.onSubmit();

      expect(component.error()).toBe('Failed to create book');
      expect(component.isSaving()).toBe(false);
    });

    it('should show error if user is not authenticated', () => {
      authService.currentUser.and.returnValue(null);

      component.form.patchValue({
        libraryId: 'lib-1',
        title: 'Test Book',
        author: 'Test Author'
      });

      component.onSubmit();

      expect(bookService.create).not.toHaveBeenCalled();
      expect(component.error()).toBe('You must be logged in to perform this action');
    });
  });

  describe('Form Submission - Edit Mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('book-1');
      bookService.getById.and.returnValue(of(mockBook));
      fixture.detectChanges();
    });

    it('should update book with valid form data', () => {
      const updatedBook: Book = {
        ...mockBook,
        title: 'Updated Book',
        author: 'Updated Author'
      };

      bookService.update.and.returnValue(of(updatedBook));

      component.form.patchValue({
        title: 'Updated Book',
        author: 'Updated Author',
        edition: 'Second Edition'
      });

      component.onSubmit();

      expect(bookService.update).toHaveBeenCalledWith('book-1', jasmine.objectContaining({
        libraryId: 'lib-1',
        title: 'Updated Book',
        author: 'Updated Author',
        edition: 'Second Edition',
        publicationDate: '2024',
        isbn: '978-0123456789',
        coverImage: 'https://example.com/cover.jpg'
      }));
      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });

    it('should include disabled libraryId in update using getRawValue', () => {
      const updatedBook: Book = {
        ...mockBook,
        title: 'Updated Book'
      };

      bookService.update.and.returnValue(of(updatedBook));

      component.form.patchValue({
        title: 'Updated Book'
      });

      component.onSubmit();

      // getRawValue() should include disabled fields
      expect(bookService.update).toHaveBeenCalledWith('book-1', jasmine.objectContaining({
        libraryId: 'lib-1'
      }));
    });

    it('should handle update errors gracefully', () => {
      bookService.update.and.returnValue(throwError(() => new Error('Update failed')));

      component.form.patchValue({
        title: 'Updated Book'
      });

      component.onSubmit();

      expect(component.error()).toBe('Failed to update book');
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Cover Image Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should accept valid URL in coverImage field', () => {
      const coverImageControl = component.form.get('coverImage');
      coverImageControl?.setValue('https://example.com/cover.jpg');

      expect(coverImageControl?.valid).toBe(true);
    });

    it('should accept data URI in coverImage field', () => {
      const coverImageControl = component.form.get('coverImage');
      coverImageControl?.setValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA');

      expect(coverImageControl?.valid).toBe(true);
    });

    it('should accept empty coverImage field', () => {
      const coverImageControl = component.form.get('coverImage');
      coverImageControl?.setValue('');

      expect(coverImageControl?.valid).toBe(true);
    });

    it('should reject coverImage exceeding max length', () => {
      const coverImageControl = component.form.get('coverImage');
      coverImageControl?.setValue('a'.repeat(2001));

      expect(coverImageControl?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Cancel Navigation', () => {
    it('should navigate to library detail when libraryId is set', () => {
      fixture.detectChanges();
      component.libraryId.set('lib-1');

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });

    it('should navigate to library from form value if libraryId signal is not set', () => {
      fixture.detectChanges();
      component.form.patchValue({ libraryId: 'lib-2' });

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-2']);
    });

    it('should navigate to home if no libraryId is available', () => {
      fixture.detectChanges();

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to library detail in edit mode', () => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('book-1');
      bookService.getById.and.returnValue(of(mockBook));
      fixture.detectChanges();

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error message for title', () => {
      const titleControl = component.form.get('title');
      titleControl?.markAsTouched();
      titleControl?.setValue('');

      expect(component.getErrorMessage('title')).toBe('Title is required');
    });

    it('should return required error message for author', () => {
      const authorControl = component.form.get('author');
      authorControl?.markAsTouched();
      authorControl?.setValue('');

      expect(component.getErrorMessage('author')).toBe('Author is required');
    });

    it('should return required error message for libraryId', () => {
      const libraryIdControl = component.form.get('libraryId');
      libraryIdControl?.markAsTouched();
      libraryIdControl?.setValue('');

      expect(component.getErrorMessage('libraryId')).toBe('Library is required');
    });

    it('should return max length error message', () => {
      const titleControl = component.form.get('title');
      titleControl?.markAsTouched();
      titleControl?.setValue('a'.repeat(501));

      expect(component.getErrorMessage('title')).toBe('Title must be less than 500 characters');
    });

    it('should return empty string if no errors', () => {
      const titleControl = component.form.get('title');
      titleControl?.setValue('Valid Title');

      expect(component.getErrorMessage('title')).toBe('');
    });

    it('should return empty string if field not touched', () => {
      const titleControl = component.form.get('title');
      titleControl?.setValue('');

      expect(component.getErrorMessage('title')).toBe('');
    });

    it('should detect field errors correctly', () => {
      const titleControl = component.form.get('title');

      expect(component.hasError('title')).toBe(false);

      titleControl?.markAsTouched();
      titleControl?.setValue('');

      expect(component.hasError('title')).toBe(true);

      titleControl?.setValue('Valid Title');

      expect(component.hasError('title')).toBe(false);
    });
  });
});
