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
import {vi} from 'vitest';

describe('BookFormComponent', () => {
  let component: BookFormComponent;
  let fixture: ComponentFixture<BookFormComponent>;
  let bookService: any;
  let libraryService: any;
  let authService: any;
  let router: any;
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
    const bookServiceSpy = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn()
    };

    const libraryServiceSpy = {
      getAll: vi.fn()
    };

    const authServiceSpy = {
      currentUser: vi.fn()
    };
    authServiceSpy.currentUser.mockReturnValue(mockUser);

    const routerSpy = {
      navigate: vi.fn()
    };

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        },
        queryParamMap: {
          get: vi.fn().mockReturnValue(null)
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

    bookService = TestBed.inject(BookService) as any;
    libraryService = TestBed.inject(LibraryService) as any;
    authService = TestBed.inject(AuthMockService) as any;
    router = TestBed.inject(Router) as any;

    // Default library service response
    libraryService.getAll.mockReturnValue(of([mockLibrary]));

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

    it('should initialize form with libraryId from query params', async () => {
      // Reconfigure with new route params
      const newActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockReturnValue(null)
          },
          queryParamMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'libraryId' ? 'lib-1' : null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: newActivatedRoute}
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(BookFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.form.get('libraryId')?.value).toBe('lib-1');
      expect(newComponent.libraryId()).toBe('lib-1');
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

    it('should handle library load errors gracefully', async () => {
      libraryService.getAll.mockReturnValue(throwError(() => new Error('Load failed')));

      const errorFixture = TestBed.createComponent(BookFormComponent);
      errorFixture.detectChanges();
      await errorFixture.whenStable();

      expect(errorFixture.componentInstance.error()).toBe('Failed to load libraries');
    });
  });

  describe('Edit Mode', () => {
    let editFixture: ComponentFixture<BookFormComponent>;
    let editComponent: BookFormComponent;

    beforeEach(async () => {
      bookService.getById.mockReturnValue(of(mockBook));

      const editActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'id' ? 'book-1' : null)
          },
          queryParamMap: {
            get: vi.fn().mockReturnValue(null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: editActivatedRoute}
        ]
      }).compileComponents();

      editFixture = TestBed.createComponent(BookFormComponent);
      editComponent = editFixture.componentInstance;
    });

    it('should load book data in edit mode', () => {
      editFixture.detectChanges();

      expect(editComponent.isEditMode()).toBe(true);
      expect(editComponent.bookId()).toBe('book-1');
      expect(bookService.getById).toHaveBeenCalledWith('book-1');
      expect(editComponent.form.get('libraryId')?.value).toBe('lib-1');
      expect(editComponent.form.get('title')?.value).toBe('Test Book');
      expect(editComponent.form.get('author')?.value).toBe('Test Author');
      expect(editComponent.form.get('edition')?.value).toBe('First Edition');
      expect(editComponent.form.get('publicationDate')?.value).toBe('2024');
      expect(editComponent.form.get('isbn')?.value).toBe('978-0123456789');
      expect(editComponent.form.get('coverImage')?.value).toBe('https://example.com/cover.jpg');
    });

    it('should disable library selection in edit mode', () => {
      editFixture.detectChanges();

      const libraryIdControl = editComponent.form.get('libraryId');
      expect(libraryIdControl?.disabled).toBe(true);
    });

    it('should handle book with optional fields missing', async () => {
      const bookWithoutOptionals: Book = {
        ...mockBook,
        edition: undefined,
        publicationDate: undefined,
        isbn: undefined,
        coverImage: undefined
      };
      bookService.getById.mockReturnValue(of(bookWithoutOptionals));

      const editActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'id' ? 'book-1' : null)
          },
          queryParamMap: {
            get: vi.fn().mockReturnValue(null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: editActivatedRoute}
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(BookFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.form.get('edition')?.value).toBe('');
      expect(newComponent.form.get('publicationDate')?.value).toBe('');
      expect(newComponent.form.get('isbn')?.value).toBe('');
      expect(newComponent.form.get('coverImage')?.value).toBe('');
    });

    it('should set error when book not found', async () => {
      bookService.getById.mockReturnValue(of(null));

      const editActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'id' ? 'book-1' : null)
          },
          queryParamMap: {
            get: vi.fn().mockReturnValue(null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: editActivatedRoute}
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(BookFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.error()).toBe('Book not found');
    });

    it('should handle load errors gracefully', async () => {
      bookService.getById.mockReturnValue(throwError(() => new Error('Load failed')));

      const editActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'id' ? 'book-1' : null)
          },
          queryParamMap: {
            get: vi.fn().mockReturnValue(null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: editActivatedRoute}
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(BookFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.error()).toBe('Failed to load book');
      expect(newComponent.isLoading()).toBe(false);
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

    it('should create book with valid form data', async () => {
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

      bookService.create.mockReturnValue(of(createdBook));

      component.form.patchValue(formValue);
      component.onSubmit();
      await fixture.whenStable();

      expect(bookService.create).toHaveBeenCalledWith('lib-1', {
        title: 'New Book',
        author: 'New Author',
        edition: 'First Edition',
        publicationDate: '2024',
        isbn: '978-0123456789',
        coverImage: 'https://example.com/cover.jpg',
        addedBy: 'mock-user-1'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/library/lib-1']);
    });

    it('should create book with only required fields', async () => {
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

      bookService.create.mockReturnValue(of(createdBook));

      component.form.patchValue(formValue);
      component.onSubmit();
      await fixture.whenStable();

      expect(bookService.create).toHaveBeenCalledWith('lib-1', {
        title: 'Minimal Book',
        author: 'Minimal Author',
        addedBy: 'mock-user-1'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/library/lib-1']);
    });

    it('should handle create errors gracefully', async () => {
      bookService.create.mockReturnValue(throwError(() => new Error('Create failed')));

      component.form.patchValue({
        libraryId: 'lib-1',
        title: 'Test Book',
        author: 'Test Author'
      });

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Failed to create book');
      expect(component.isSaving()).toBe(false);
    });

    it('should show error if user is not authenticated', () => {
      authService.currentUser.mockReturnValue(null);

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
    let editFixture: ComponentFixture<BookFormComponent>;
    let editComponent: BookFormComponent;

    beforeEach(async () => {
      bookService.getById.mockReturnValue(of(mockBook));

      const editActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'id' ? 'book-1' : null)
          },
          queryParamMap: {
            get: vi.fn().mockReturnValue(null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: editActivatedRoute}
        ]
      }).compileComponents();

      editFixture = TestBed.createComponent(BookFormComponent);
      editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
    });

    it('should update book with valid form data', async () => {
      const updatedBook: Book = {
        ...mockBook,
        title: 'Updated Book',
        author: 'Updated Author'
      };

      bookService.update.mockReturnValue(of(updatedBook));

      editComponent.form.patchValue({
        title: 'Updated Book',
        author: 'Updated Author',
        edition: 'Second Edition'
      });

      editComponent.onSubmit();
      await editFixture.whenStable();

      expect(bookService.update).toHaveBeenCalledWith('book-1', {
        libraryId: 'lib-1',
        title: 'Updated Book',
        author: 'Updated Author',
        edition: 'Second Edition',
        publicationDate: '2024',
        isbn: '978-0123456789',
        coverImage: 'https://example.com/cover.jpg'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/library/lib-1']);
    });

    it('should include disabled libraryId in update using getRawValue', async () => {
      const updatedBook: Book = {
        ...mockBook,
        title: 'Updated Book'
      };

      bookService.update.mockReturnValue(of(updatedBook));

      editComponent.form.patchValue({
        title: 'Updated Book'
      });

      editComponent.onSubmit();
      await editFixture.whenStable();

      // getRawValue() should include disabled fields
      expect(bookService.update).toHaveBeenCalledWith('book-1', expect.objectContaining({
        libraryId: 'lib-1',
        title: 'Updated Book'
      }));
    });

    it('should handle update errors gracefully', async () => {
      bookService.update.mockReturnValue(throwError(() => new Error('Update failed')));

      editComponent.form.patchValue({
        title: 'Updated Book'
      });

      editComponent.onSubmit();
      await editFixture.whenStable();

      expect(editComponent.error()).toBe('Failed to update book');
      expect(editComponent.isSaving()).toBe(false);
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

    it('should navigate to library detail in edit mode', async () => {
      bookService.getById.mockReturnValue(of(mockBook));

      const editActivatedRoute = {
        snapshot: {
          paramMap: {
            get: vi.fn().mockImplementation((key: string) => key === 'id' ? 'book-1' : null)
          },
          queryParamMap: {
            get: vi.fn().mockReturnValue(null)
          }
        }
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          BookFormComponent,
          ReactiveFormsModule,
          NoopAnimationsModule
        ],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {provide: BookService, useValue: bookService},
          {provide: LibraryService, useValue: libraryService},
          {provide: AuthMockService, useValue: authService},
          {provide: Router, useValue: router},
          {provide: ActivatedRoute, useValue: editActivatedRoute}
        ]
      }).compileComponents();

      const editFixture = TestBed.createComponent(BookFormComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      editComponent.onCancel();

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
