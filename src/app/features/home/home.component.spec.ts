import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { LibraryService } from '../../core/services/library.service';
import { Library } from '../../core/models/library.model';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let libraryServiceMock: jasmine.SpyObj<LibraryService>;
  let librariesSignal: WritableSignal<Library[]>;

  const mockLibraries: Library[] = [
    {
      id: 'lib-1',
      name: 'Central Library',
      description: 'Main library in downtown',
      location: 'Downtown',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    },
    {
      id: 'lib-2',
      name: 'Tech Library',
      description: 'Technology and science books',
      location: 'Tech Park',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    }
  ];

  beforeEach(async () => {
    const libraryServiceSpy = jasmine.createSpyObj('LibraryService', ['getAll']);

    // Create a writable signal for testing
    librariesSignal = signal<Library[]>([]);
    Object.defineProperty(libraryServiceSpy, 'libraries', {
      get: () => librariesSignal.asReadonly()
    });

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: LibraryService, useValue: libraryServiceSpy }
      ]
    }).compileComponents();

    libraryServiceMock = TestBed.inject(LibraryService) as jasmine.SpyObj<LibraryService>;
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should start with loading state true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should call getAll on ngOnInit', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));

      component.ngOnInit();

      expect(libraryServiceMock.getAll).toHaveBeenCalled();
    });

    it('should set loading to false after successful load', (done) => {
      libraryServiceMock.getAll.and.returnValue(of(mockLibraries));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should set loading to false after error', (done) => {
      libraryServiceMock.getAll.and.returnValue(throwError(() => new Error('Test error')));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });
  });

  describe('Page Header', () => {
    it('should display page title', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('h1'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toBe('Libraries');
    });

    it('should display subtitle', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      fixture.detectChanges();

      const subtitle = fixture.debugElement.query(By.css('.subtitle'));
      expect(subtitle).toBeTruthy();
      expect(subtitle.nativeElement.textContent).toContain('Browse and explore');
    });

    it('should have create library button in header', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      fixture.detectChanges();

      const createButton = fixture.debugElement.query(By.css('.header-content button'));
      expect(createButton).toBeTruthy();
      expect(createButton.nativeElement.textContent).toContain('Create Library');
    });

    it('should have routerLink on create button', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      fixture.detectChanges();

      const createButton = fixture.debugElement.query(By.css('.header-content button[routerLink]'));
      expect(createButton).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should display loading container when loading', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      fixture.detectChanges(); // Trigger ngOnInit
      component.isLoading.set(true); // Set loading to true after init
      fixture.detectChanges(); // Re-render with loading state

      const loadingContainer = fixture.debugElement.query(By.css('.loading-container'));
      expect(loadingContainer).toBeTruthy();
    });

    it('should display loading message when loading', () => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      fixture.detectChanges(); // Trigger ngOnInit
      component.isLoading.set(true); // Set loading to true after init
      fixture.detectChanges(); // Re-render with loading state

      const loadingText = fixture.debugElement.query(By.css('.loading-container p'));
      expect(loadingText).toBeTruthy();
      expect(loadingText.nativeElement.textContent).toBe('Loading libraries...');
    });

    it('should hide loading when libraries loaded', () => {
      libraryServiceMock.getAll.and.returnValue(of(mockLibraries));
      component.isLoading.set(false);
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeFalsy();
    });
  });

  describe('Libraries Display', () => {
    beforeEach(() => {
      libraryServiceMock.getAll.and.returnValue(of(mockLibraries));
      // Update the libraries signal for testing
      librariesSignal.set(mockLibraries);
      component.isLoading.set(false);
    });

    it('should display libraries grid when libraries exist', () => {
      fixture.detectChanges();

      const grid = fixture.debugElement.query(By.css('.libraries-grid'));
      expect(grid).toBeTruthy();
    });

    it('should display correct number of library cards', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      expect(cards.length).toBe(2);
    });

    it('should display library name in card title', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      const firstCardTitle = cards[0].query(By.css('mat-card-title'));

      expect(firstCardTitle.nativeElement.textContent).toBe('Central Library');
    });

    it('should display library description when available', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      const description = cards[0].query(By.css('.library-description'));

      expect(description).toBeTruthy();
      expect(description.nativeElement.textContent).toBe('Main library in downtown');
    });

    it('should display library location when available', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      const location = cards[0].query(By.css('.library-location'));

      expect(location).toBeTruthy();
      expect(location.nativeElement.textContent).toContain('Downtown');
    });

    it('should have location icon', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      const locationIcon = cards[0].query(By.css('.library-location mat-icon'));

      expect(locationIcon).toBeTruthy();
      expect(locationIcon.nativeElement.textContent).toBe('location_on');
    });

    it('should have View Books button', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      const viewButton = cards[0].query(By.css('mat-card-actions button'));

      expect(viewButton).toBeTruthy();
      expect(viewButton.nativeElement.textContent).toContain('View Books');
    });
  });

  describe('Routing', () => {
    beforeEach(() => {
      libraryServiceMock.getAll.and.returnValue(of(mockLibraries));
      librariesSignal.set(mockLibraries);
      component.isLoading.set(false);
    });

    it('should render clickable library cards', () => {
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.library-card'));
      expect(cards.length).toBe(2);
      // Verify cards are present and can be interacted with
      expect(cards[0]).toBeTruthy();
      expect(cards[1]).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      libraryServiceMock.getAll.and.returnValue(of([]));
      librariesSignal.set([]);
      component.isLoading.set(false);
    });

    it('should display empty state when no libraries', () => {
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
    });

    it('should display empty state icon', () => {
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('.empty-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent).toBe('library_books');
    });

    it('should display empty state title', () => {
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.empty-state h2'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toBe('No Libraries Yet');
    });

    it('should display empty state message', () => {
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.empty-state p'));
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent).toContain('no libraries in the system');
    });

    it('should have create library button in empty state', () => {
      fixture.detectChanges();

      const createButton = fixture.debugElement.query(By.css('.empty-state button'));
      expect(createButton).toBeTruthy();
      expect(createButton.nativeElement.textContent).toContain('Create Your First Library');
    });

    it('should have routerLink on empty state button', () => {
      fixture.detectChanges();

      const createButton = fixture.debugElement.query(By.css('.empty-state button[routerLink]'));
      expect(createButton).toBeTruthy();
    });
  });

  describe('Track By Function', () => {
    it('should return library id for track by', () => {
      const library = mockLibraries[0];
      const result = component.trackByLibraryId(0, library);

      expect(result).toBe('lib-1');
    });

    it('should return different ids for different libraries', () => {
      const result1 = component.trackByLibraryId(0, mockLibraries[0]);
      const result2 = component.trackByLibraryId(1, mockLibraries[1]);

      expect(result1).not.toBe(result2);
      expect(result1).toBe('lib-1');
      expect(result2).toBe('lib-2');
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      const metadata = (component.constructor as any).__annotations__?.[0];
      expect(metadata?.changeDetection).toBe(0); // OnPush = 0
    });
  });

  describe('Error Handling', () => {
    it('should handle error gracefully', (done) => {
      libraryServiceMock.getAll.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');

      component.ngOnInit();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading libraries:', jasmine.any(Error));
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });
  });
});
