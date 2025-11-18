# Research & Technical Decisions

**Feature**: Library Management Homepage
**Date**: 2025-11-12
**Phase**: 0 (Outline & Research)

## Overview

This document captures technical research and decisions for implementing the Booksfeir library management system. All decisions align with the project constitution (Angular 20, standalone components, signals, zoneless operation, Material Design).

---

## 1. Angular Material Component Selection

### Decision

Use the following Angular Material components:

- **MatCard** - Library cards on homepage
- **MatNavList** / **MatList** - Book lists within libraries
- **MatToolbar** - Top navigation bar
- **MatButton** / **MatIconButton** - Actions (create, edit, delete)
- **MatDialog** - Forms and confirmations (library form, book form, delete confirmation, purchase request)
- **MatFormField** + **MatInput** - Text inputs in forms
- **MatSelect** - Dropdowns if needed
- **MatChip** - Status indicators (borrowed/available)
- **MatIcon** - Icons throughout UI
- **MatMenu** - User profile menu

### Rationale

- All components follow Material Design principles required by constitution
- Component harnesses available for testing (Karma + Jasmine requirement)
- Built-in accessibility (ARIA labels, keyboard navigation)
- Responsive design support out of the box
- Minimal custom styling needed

### Alternatives Considered

- **Custom components**: Rejected due to increased development time, testing complexity, and accessibility requirements
- **Other UI libraries (PrimeNG, Clarity)**: Rejected as constitution mandates Angular Material

### Implementation Notes

- Use `mat-card` with `mat-card-header`, `mat-card-content`, `mat-card-actions` for library cards
- Use `mat-nav-list` for book lists to support router navigation
- Use `MatDialog` service with reactive forms for all create/edit operations
- Implement `MatDialogRef` for proper dialog lifecycle management in zoneless mode

### Code References

From Context7 documentation:
```html
<!-- Navigation list pattern -->
<mat-nav-list>
  @for (item of items(); track item.id) {
    <a mat-list-item [routerLink]="['/library', item.id]">
      <span matListItemTitle>{{ item.name }}</span>
      <span matListItemLine>{{ item.description }}</span>
    </a>
  }
</mat-nav-list>
```

---

## 2. Google Books API Integration

### Decision

Integrate Google Books API v1 with the following approach:

**Endpoint**: `GET https://www.googleapis.com/books/v1/volumes`

**Query Strategy**:
- Parameter: `q` (search query from user input)
- Parameter: `orderBy=newest` (sort by publication date, most recent first)
- Parameter: `maxResults=5` (limit to 5 results per spec)
- No authentication required for public search

**Response Handling**:
- Parse `items[]` array from response
- Extract from `volumeInfo`: title, authors, publishedDate, industryIdentifiers (for ISBN), imageLinks.thumbnail
- Map to internal `Book` model
- Silent failure on API errors (per clarification #4)

### Rationale

- Google Books API v1 is specified in constitution as required external API
- RESTful interface integrates cleanly with Angular `HttpClient`
- No authentication needed simplifies local development
- `orderBy=newest` directly implements "sorted by most recent publication date" requirement (FR-012)
- Silent failure aligns with clarification decision (show only local results)

### Alternatives Considered

- **Open Library API**: Rejected as constitution specifies Google Books API v1
- **Error retry logic**: Rejected per clarification #4 (silent fail preferred)
- **Caching API responses**: Deferred to future enhancement (not in MVP scope)

### Implementation Notes

```typescript
// Service interface
interface GoogleBooksService {
  search(query: string): Observable<Book[]>;
}

// API response mapping
interface GoogleBooksVolume {
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    industryIdentifiers?: Array<{type: string; identifier: string}>;
    imageLinks?: {thumbnail?: string};
  };
}

// Error handling: catchError returns empty array
```

**API Query Format** (per constitution):
```
GET /volumes?q="{search_terms}"&orderBy=newest&maxResults=5
```

---

## 3. GCP Datastore Mocking Strategy

### Decision

Implement mock-first development with injectable service abstraction:

**Service Layer**:
- Abstract `DatastoreService` interface defining CRUD operations
- `DatastoreMockService` implementation for local development
- `DatastoreGcpService` implementation for production (future)
- Dependency injection in `app.config.ts` based on environment

**Mock Storage**:
- In-memory storage using signals (`WritableSignal<Map<string, Entity>>`)
- Persistent across session using `localStorage` for development convenience
- Auto-generate IDs using UUID or timestamp

**Mock Behavior**:
- Simulate async operations with `setTimeout` (50-100ms delay)
- Return `Observable` to match HttpClient patterns
- Support all CRUD operations (create, read, update, delete, list)

### Rationale

- Constitution mandates mock-first development for external services
- Enables full local development without GCP project setup
- Maintains identical service interface for easy production swap
- Signals enable reactive UI updates in zoneless mode
- `localStorage` persistence improves developer experience

### Alternatives Considered

- **Direct GCP integration**: Rejected by constitution requirement for mock-first approach
- **JSON Server**: Rejected as adds unnecessary dependency; in-memory is sufficient
- **IndexedDB**: Rejected as overly complex for MVP; `localStorage` adequate

### Implementation Notes

```typescript
// Core abstraction
export interface DatastoreService {
  create<T>(collection: string, entity: T): Observable<T & {id: string}>;
  read<T>(collection: string, id: string): Observable<T | null>;
  update<T>(collection: string, id: string, entity: Partial<T>): Observable<T>;
  delete(collection: string, id: string): Observable<void>;
  list<T>(collection: string): Observable<T[]>;
  query<T>(collection: string, filters: Filter[]): Observable<T[]>;
}

// App config provider
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: DatastoreService,
      useClass: environment.production ? DatastoreGcpService : DatastoreMockService
    }
  ]
};
```

---

## 4. Signal-Based State Management

### Decision

Use Angular Signals with the following patterns:

**Service-Level Signals**:
- Each data service maintains `WritableSignal` for its entities
- Use `computed()` for derived state (e.g., available books = all books - borrowed books)
- Use `effect()` sparingly, only for side effects (e.g., localStorage sync)

**Component-Level Signals**:
- Use `input()` for component inputs
- Use `output()` for component outputs
- Local component state in `signal()` (e.g., `selectedLibrary = signal<Library | null>(null)`)
- Computed values with `computed()` (e.g., `hasBooks = computed(() => this.books().length > 0)`)

**No External State Management**:
- No NgRx, Akita, or other state libraries
- Services act as state containers
- Signals provide reactivity without zone.js

### Rationale

- Constitution mandates signals for state management
- Signals eliminate need for zone.js (zoneless requirement)
- Fine-grained reactivity improves performance with OnPush change detection
- Simpler mental model than RxJS for UI state
- No external dependencies required

### Alternatives Considered

- **NgRx Signals Store**: Rejected as constitution prohibits external state libraries unless justified
- **RxJS BehaviorSubject**: Rejected as signals are more performant and idiomatic in Angular 18+
- **Component state only**: Rejected as cross-component state sharing needed

### Implementation Notes

```typescript
// Service pattern
@Injectable({ providedIn: 'root' })
export class LibraryService {
  private librariesSignal = signal<Library[]>([]);

  // Public readonly signal
  libraries = this.librariesSignal.asReadonly();

  // Computed state
  libraryCount = computed(() => this.libraries().length);

  // Methods update signals
  addLibrary(library: Library): void {
    this.librariesSignal.update(libs => [...libs, library]);
  }
}

// Component pattern
@Component({
  selector: 'sfeir-library-card',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryCardComponent {
  library = input.required<Library>();
  edit = output<Library>();

  private isExpanded = signal(false);

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }
}
```

---

## 5. Zoneless Operation Setup

### Decision

Configure application for zoneless change detection:

**Application Config** (`app.config.ts`):
```typescript
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // ... other providers
  ]
};
```

**Component Requirements**:
- All components use `ChangeDetectionStrategy.OnPush`
- All async operations use signals or explicit `ChangeDetectorRef` if necessary
- Event handlers automatically trigger change detection in zoneless mode

**Testing Adjustments**:
- Remove `zone.js` imports from `karma.conf.js`
- Use `ComponentFixture.detectChanges()` explicitly in tests
- Flush async operations with `TestBed.flushEffects()`

### Rationale

- Constitution mandates zoneless operation (NON-NEGOTIABLE)
- Eliminates zone.js overhead (~50KB bundle size reduction)
- Aligns with Angular's future direction (zone.js deprecated)
- Improved performance with signals + OnPush
- Forces explicit reactivity patterns (better code quality)

### Alternatives Considered

- **Zone.js with OnPush**: Rejected by constitution (zoneless is NON-NEGOTIABLE)
- **Hybrid approach**: Not supported by Angular; either zoneless or zone.js

### Implementation Notes

**Polling/Timers**: Use `rxjs` operators with explicit subscription management
```typescript
// Correct in zoneless
interval(1000).pipe(
  takeUntilDestroyed(),
  tap(() => this.count.update(c => c + 1))
).subscribe();
```

**Forms**: Reactive forms work correctly; template-driven forms prohibited by constitution anyway

**Third-party libraries**: Verify compatibility; most modern libraries support zoneless

---

## 6. Routing and Navigation

### Decision

Use Angular Router with lazy-loaded feature routes:

**Route Structure**:
```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent }, // Library list
  {
    path: 'library',
    children: [
      { path: 'new', component: LibraryFormComponent },
      { path: ':id', component: LibraryDetailComponent }, // Book list
      { path: ':id/edit', component: LibraryFormComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
```

**Lazy Loading**: Each feature route loads minimal code:
```typescript
{
  path: 'library',
  loadChildren: () => import('./features/library/library.routes')
}
```

### Rationale

- Constitution requires lazy loading for all feature routes
- Improves initial load performance
- Clear hierarchical structure matches domain model
- Angular Router fully compatible with zoneless mode

### Alternatives Considered

- **Flat route structure**: Rejected for poor scalability
- **Eager loading**: Rejected by constitution requirement

---

## 7. Form Handling

### Decision

Use Reactive Forms with signals integration:

**Form Creation**:
```typescript
private fb = inject(FormBuilder);

libraryForm = this.fb.group({
  name: ['', [Validators.required]],
  description: [''],
  location: ['']
});
```

**Validation**:
- Use built-in validators (`Validators.required`, `Validators.maxLength`)
- Display errors using Material form field error state
- Custom validators for business logic if needed

**Submit Handling**:
```typescript
onSubmit(): void {
  if (this.libraryForm.valid) {
    const library = this.libraryForm.getRawValue();
    this.libraryService.create(library).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => this.errorSignal.set(err.message)
    });
  }
}
```

### Rationale

- Constitution mandates Reactive Forms (template-driven prohibited)
- Type-safe with TypeScript strict mode
- Works seamlessly in zoneless mode
- Material form fields provide built-in error display

---

## 8. Image Handling

### Decision

Use `NgOptimizedImage` directive for cover images:

```html
<img [ngSrc]="book.coverImage"
     alt="{{ book.title }} cover"
     width="128"
     height="192"
     priority="false" />
```

**Upload Strategy**:
- Accept file uploads as `File` objects
- Convert to base64 data URL for mock storage
- For production: upload to GCP Cloud Storage, store URL in Datastore

### Rationale

- Constitution recommends `NgOptimizedImage` for static images
- Automatic lazy loading and srcset generation
- Better performance than plain `<img>`

### Alternatives Considered

- **Plain img tag**: Rejected for missing performance optimizations
- **External CDN**: Deferred to production implementation

**Note**: Constitution states `NgOptimizedImage` doesn't work with inline base64. For mock development with base64 images, use regular `<img>` with `[src]` binding.

---

## 9. Testing Strategy

### Decision

Implement comprehensive testing with Karma + Jasmine:

**Unit Tests** (co-located `*.spec.ts`):
- Test components with Material harnesses
- Test services with mock dependencies
- Use `signal()` in tests for reactive values
- Target 80% coverage minimum

**Component Harness Example**:
```typescript
import { MatButtonHarness } from '@angular/material/button/testing';

it('should emit edit event when edit button clicked', async () => {
  const harness = await loader.getHarness(MatButtonHarness.with({text: 'Edit'}));
  spyOn(component.edit, 'emit');
  await harness.click();
  expect(component.edit.emit).toHaveBeenCalled();
});
```

**Integration Tests**:
- Test user workflows (create library → add book → borrow book)
- Use `TestBed` with real routing
- Mock external services (Google Books, Datastore)

### Rationale

- Constitution mandates Karma + Jasmine (NON-NEGOTIABLE)
- Component harnesses ensure tests don't break with Material updates
- 80% coverage catches regressions
- Co-located specs improve maintainability

---

## 10. Authentication Mock

### Decision

Create `AuthMockService` with current user signal:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthMockService {
  private currentUserSignal = signal<User>({
    id: 'mock-user-1',
    name: 'Demo User',
    avatar: '/assets/default-avatar.png'
  });

  currentUser = this.currentUserSignal.asReadonly();
}
```

**Navigation Bar**: Display `currentUser()` name and avatar

**Guards**: Simple `canActivate` returning `true` for MVP

### Rationale

- Constitution requires GCP Identity Federation mock
- Simplifies development without auth complexity
- Easy to swap for production auth service
- Provides user context for borrow tracking

---

## Summary of Technical Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Framework | Angular 20.x | Constitution requirement |
| UI Library | Angular Material 20.x | Constitution requirement |
| State Management | Angular Signals | Constitution requirement |
| Change Detection | Zoneless (provideExperimentalZonelessChangeDetection) | Constitution requirement |
| Forms | Reactive Forms | Constitution requirement |
| Testing | Karma + Jasmine | Constitution requirement |
| HTTP Client | @angular/common/http | Standard Angular, no alternatives |
| Routing | Angular Router | Standard Angular, lazy loading required |
| Build Tool | Angular CLI | Constitution requirement |
| Storage (Dev) | Mock service + localStorage | Constitution mock-first requirement |
| Storage (Prod) | GCP Datastore | Constitution requirement (future) |
| Auth (Dev) | Mock service | Constitution mock-first requirement |
| Auth (Prod) | GCP Identity Federation | Constitution requirement (future) |
| External API | Google Books API v1 | Constitution requirement |

---

## Open Questions & Risks

### Resolved
None - all NEEDS CLARIFICATION items addressed through clarification session.

### Future Considerations
1. **Production GCP integration**: Will require GCP project setup, service account credentials, and Datastore schema design
2. **Image storage**: Production needs GCP Cloud Storage bucket for cover images
3. **Purchase request workflow**: Admin approval UI not in MVP scope; deferred to future story
4. **Search optimization**: Local book search uses simple string matching; could enhance with fuzzy search
5. **Offline support**: Service worker for offline capability out of MVP scope

---

## References

- Project Constitution: `.specify/memory/constitution.md` (v1.3.1)
- Feature Specification: `specs/001-library-homepage/spec.md`
- Angular Material Documentation: Retrieved via Context7 `/angular/components/20.1.2`
- Google Books API Documentation: Retrieved via Context7 `/websites/developers_google-books`
- Angular Documentation: https://angular.dev (for zoneless change detection, signals, etc.)