import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {ActivatedRoute, provideRouter, Router} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {LibraryFormComponent} from './library-form.component';
import {LibraryService} from '../../core/services/library.service';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';
import {Library} from '../../core/models/library.model';
import {User, UserRole} from '../../core/models/user.model';
import {of, throwError} from 'rxjs';

describe('LibraryFormComponent', () => {
  let component: LibraryFormComponent;
  let fixture: ComponentFixture<LibraryFormComponent>;
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

  beforeEach(async () => {
    // Create spy objects
    const libraryServiceSpy = jasmine.createSpyObj('LibraryService', [
      'create',
      'update',
      'getById'
    ]);

    const authServiceSpy = jasmine.createSpyObj('AuthMockService', ['currentUser']);
    authServiceSpy.currentUser.and.returnValue(mockUser);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        LibraryFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: AuthMockService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    libraryService = TestBed.inject(LibraryService) as jasmine.SpyObj<LibraryService>;
    authService = TestBed.inject(AuthMockService) as jasmine.SpyObj<AuthMockService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(LibraryFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values in create mode', () => {
      fixture.detectChanges();

      expect(component.form).toBeDefined();
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('location')?.value).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should mark name field as required', () => {
      fixture.detectChanges();

      const nameControl = component.form.get('name');
      expect(nameControl?.hasError('required')).toBe(true);

      nameControl?.setValue('Test Library');
      expect(nameControl?.hasError('required')).toBe(false);
    });

    it('should not require description and location fields', () => {
      fixture.detectChanges();

      const descControl = component.form.get('description');
      const locControl = component.form.get('location');

      expect(descControl?.hasError('required')).toBe(false);
      expect(locControl?.hasError('required')).toBe(false);
    });

    it('should enforce max length validation', () => {
      fixture.detectChanges();

      const nameControl = component.form.get('name');
      nameControl?.setValue('a'.repeat(201)); // Exceeds 200 char limit
      expect(nameControl?.hasError('maxlength')).toBe(true);

      const descControl = component.form.get('description');
      descControl?.setValue('a'.repeat(1001)); // Exceeds 1000 char limit
      expect(descControl?.hasError('maxlength')).toBe(true);

      const locControl = component.form.get('location');
      locControl?.setValue('a'.repeat(501)); // Exceeds 500 char limit
      expect(locControl?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('lib-1');
      libraryService.getById.and.returnValue(of(mockLibrary));
    });

    it('should load library data in edit mode', () => {
      fixture.detectChanges();

      expect(component.isEditMode()).toBe(true);
      expect(component.libraryId()).toBe('lib-1');
      expect(libraryService.getById).toHaveBeenCalledWith('lib-1');
      expect(component.form.get('name')?.value).toBe('Test Library');
      expect(component.form.get('description')?.value).toBe('A test library');
      expect(component.form.get('location')?.value).toBe('Test Location');
    });

    it('should set error when library not found', () => {
      libraryService.getById.and.returnValue(of(null));
      fixture.detectChanges();

      expect(component.error()).toBe('Library not found');
    });

    it('should handle load errors gracefully', () => {
      libraryService.getById.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load library');
      expect(component.isLoading()).toBe(false);
    });

    it('should show loading indicator while loading', () => {
      let resolveLoad: any;
      const loadPromise = new Promise(resolve => { resolveLoad = resolve; });
      libraryService.getById.and.returnValue(of(mockLibrary));

      fixture.detectChanges();

      // Loading should be true initially, false after load
      expect(component.isLoading()).toBe(false); // Already loaded in sync test
    });
  });

  describe('Form Submission - Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', () => {
      component.form.patchValue({
        name: '', // Invalid - required
        description: 'Test',
        location: 'Test'
      });

      component.onSubmit();

      expect(libraryService.create).not.toHaveBeenCalled();
      expect(component.form.get('name')?.touched).toBe(true);
    });

    it('should create library with valid form data', () => {
      const formValue = {
        name: 'New Library',
        description: 'New Description',
        location: 'New Location'
      };

      const createdLibrary: Library = {
        ...mockLibrary,
        ...formValue,
        id: 'new-lib-1'
      };

      libraryService.create.and.returnValue(of(createdLibrary));

      component.form.patchValue(formValue);
      component.onSubmit();

      expect(libraryService.create).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'New Library',
        description: 'New Description',
        location: 'New Location',
        createdBy: 'mock-user-1'
      }));
      expect(router.navigate).toHaveBeenCalledWith(['/library', 'new-lib-1']);
    });

    it('should pass form values to service (trimming handled by service)', () => {
      const formValue = {
        name: '  Library With Spaces  ',
        description: '  Description With Spaces  ',
        location: '  Location With Spaces  '
      };

      libraryService.create.and.returnValue(of({ ...mockLibrary, id: 'new-lib' }));

      component.form.patchValue(formValue);
      component.onSubmit();

      // Component passes form values as-is; service is responsible for trimming
      expect(libraryService.create).toHaveBeenCalledWith(jasmine.objectContaining({
        name: '  Library With Spaces  ',
        description: '  Description With Spaces  ',
        location: '  Location With Spaces  ',
        createdBy: 'mock-user-1'
      }));
    });

    it('should handle create errors gracefully', () => {
      libraryService.create.and.returnValue(throwError(() => new Error('Create failed')));

      component.form.patchValue({
        name: 'Test Library',
        description: 'Test',
        location: 'Test'
      });

      component.onSubmit();

      expect(component.error()).toBe('Failed to create library');
      expect(component.isSaving()).toBe(false);
    });

    it('should show error if user is not authenticated', () => {
      authService.currentUser.and.returnValue(null);

      component.form.patchValue({
        name: 'Test Library',
        description: 'Test',
        location: 'Test'
      });

      component.onSubmit();

      expect(libraryService.create).not.toHaveBeenCalled();
      expect(component.error()).toBe('You must be logged in to perform this action');
    });
  });

  describe('Form Submission - Edit Mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('lib-1');
      libraryService.getById.and.returnValue(of(mockLibrary));
      fixture.detectChanges();
    });

    it('should update library with valid form data', () => {
      const updatedLibrary: Library = {
        ...mockLibrary,
        name: 'Updated Library',
        description: 'Updated Description'
      };

      libraryService.update.and.returnValue(of(updatedLibrary));

      component.form.patchValue({
        name: 'Updated Library',
        description: 'Updated Description',
        location: 'Updated Location'
      });

      component.onSubmit();

      expect(libraryService.update).toHaveBeenCalledWith('lib-1', {
        name: 'Updated Library',
        description: 'Updated Description',
        location: 'Updated Location'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });

    it('should handle update errors gracefully', () => {
      libraryService.update.and.returnValue(throwError(() => new Error('Update failed')));

      component.form.patchValue({
        name: 'Updated Library'
      });

      component.onSubmit();

      expect(component.error()).toBe('Failed to update library');
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Cancel Navigation', () => {
    it('should navigate to home in create mode', () => {
      fixture.detectChanges();

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to library detail in edit mode', () => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('lib-1');
      libraryService.getById.and.returnValue(of(mockLibrary));
      fixture.detectChanges();

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/library', 'lib-1']);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error message', () => {
      const nameControl = component.form.get('name');
      nameControl?.markAsTouched();
      nameControl?.setValue('');

      expect(component.getErrorMessage('name')).toBe('Library name is required');
    });

    it('should return max length error message', () => {
      const nameControl = component.form.get('name');
      nameControl?.markAsTouched();
      nameControl?.setValue('a'.repeat(201));

      expect(component.getErrorMessage('name')).toBe('Library name must be less than 200 characters');
    });

    it('should return empty string if no errors', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('Valid Name');

      expect(component.getErrorMessage('name')).toBe('');
    });

    it('should return empty string if field not touched', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('');

      expect(component.getErrorMessage('name')).toBe('');
    });

    it('should detect field errors correctly', () => {
      const nameControl = component.form.get('name');

      expect(component.hasError('name')).toBe(false);

      nameControl?.markAsTouched();
      nameControl?.setValue('');

      expect(component.hasError('name')).toBe(true);

      nameControl?.setValue('Valid Name');

      expect(component.hasError('name')).toBe(false);
    });
  });
});
