# Developer Quickstart: Library Management Homepage

**Feature**: 001-library-homepage
**Last Updated**: 2025-11-12
**Estimated Setup Time**: 15-20 minutes

## Overview

This guide helps developers set up and start working on the Booksfeir library management homepage feature. The feature uses Angular 20 with standalone components, signals for state management, Angular Material for UI, and runs in zoneless mode.

---

## Prerequisites

Ensure you have the following installed:

- **Node.js**: 20.x or later ([Download](https://nodejs.org/))
- **npm**: 10.x or later (comes with Node.js)
- **Angular CLI**: 20.x (`npm install -g @angular/cli@20`)
- **Git**: For version control
- **IDE**: VS Code recommended with Angular Language Service extension

**Verify installations**:
```bash
node --version   # Should show v20.x or higher
npm --version    # Should show 10.x or higher
ng version       # Should show Angular CLI 20.x
```

---

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd booksfeir

# Checkout the feature branch
git checkout 001-library-homepage

# Install dependencies
npm install
```

### 2. Verify Angular Configuration

The project should already be configured for:
- **Standalone components** (default in Angular 20)
- **Zoneless operation** (`provideExperimentalZonelessChangeDetection()` in `app.config.ts`)
- **Strict TypeScript** (`tsconfig.json` with `strict: true`)
- **Angular Material** (should be in `package.json`)

If Angular Material is not installed, run:
```bash
ng add @angular/material
# Select theme: Choose any Material theme (Indigo/Pink recommended)
# Set up global Angular Material typography styles: Yes
# Include Angular animations: Yes
```

### 3. Run Development Server

```bash
npm start
# or
ng serve

# Open browser to http://localhost:4200
```

Expected output: Application loads with empty homepage (no libraries yet).

---

## Project Structure

```
src/app/
├── core/                          # Shared across features
│   ├── models/                    # TypeScript interfaces
│   │   ├── library.model.ts
│   │   ├── book.model.ts
│   │   ├── borrow-transaction.model.ts
│   │   ├── purchase-request.model.ts
│   │   └── user.model.ts
│   ├── services/                  # Business logic services
│   │   ├── library.service.ts     # Library CRUD operations
│   │   ├── book.service.ts        # Book CRUD operations
│   │   ├── borrow.service.ts      # Borrow/return logic
│   │   ├── purchase-request.service.ts  # Purchase requests
│   │   ├── google-books.service.ts      # Google Books API
│   │   └── mock/                  # Mock implementations (local dev)
│   │       ├── datastore-mock.service.ts
│   │       └── auth-mock.service.ts
│   └── guards/
│       └── auth.guard.ts          # Route protection
├── features/                      # Feature modules
│   ├── home/                      # Homepage (library list)
│   │   ├── home.component.ts
│   │   └── home.component.spec.ts
│   ├── library-detail/            # Single library view
│   │   ├── library-detail.component.ts
│   │   ├── library-detail.component.spec.ts
│   │   ├── components/            # Sub-components
│   │   │   ├── book-list/
│   │   │   ├── book-form/
│   │   │   └── book-search/
│   │   └── library-detail.routes.ts
│   ├── library-form/              # Create/Edit library
│   │   ├── library-form.component.ts
│   │   └── library-form.component.spec.ts
│   └── shared/                    # Shared UI components
│       ├── navigation/            # Top navigation bar
│       │   ├── navigation.component.ts
│       │   └── navigation.component.spec.ts
│       └── dialogs/               # Reusable dialogs
│           ├── confirm-dialog/
│           └── purchase-request-dialog/
├── app.component.ts               # Root component
├── app.config.ts                  # App providers (zoneless, routing, etc.)
└── app.routes.ts                  # Top-level routes
```

---

## Development Workflow

### Creating a New Component

Use Angular CLI with standalone flag:

```bash
# Generate standalone component
ng generate component features/home --standalone

# Generate component with Material imports
ng generate component features/library-form --standalone

# The --standalone flag is default in Angular 20, but explicit is clear
```

**Component Template** (follow this pattern):

```typescript
import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'sfeir-my-component',  // Always prefix with 'sfeir-'
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush  // REQUIRED
})
export class MyComponentComponent {
  // Use input() and output() functions (NOT decorators)
  title = input.required<string>();
  itemClicked = output<string>();

  // Use signals for local state
  private isExpanded = signal(false);

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }
}
```

### Creating a New Service

```bash
ng generate service core/services/my-service
```

**Service Template** (follow this pattern):

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Singleton service
})
export class MyService {
  // Use inject() function (NOT constructor injection)
  private http = inject(HttpClient);

  // Private writable signal
  private dataSignal = signal<MyData[]>([]);

  // Public readonly signal
  data = this.dataSignal.asReadonly();

  // Computed state
  dataCount = computed(() => this.data().length);

  // Methods update signals
  loadData(): Observable<MyData[]> {
    return this.http.get<MyData[]>('/api/data').pipe(
      tap(data => this.dataSignal.set(data))
    );
  }
}
```

### Writing Tests

All components and services MUST have co-located `.spec.ts` files.

**Component Test Template**:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my-component.component';
import { MatButtonHarness } from '@angular/material/button/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]  // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);

    // Set required inputs
    fixture.componentRef.setInput('title', 'Test Title');

    fixture.detectChanges();  // Manual detection in zoneless mode
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit event when button clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness);
    spyOn(component.itemClicked, 'emit');

    await button.click();

    expect(component.itemClicked.emit).toHaveBeenCalledWith('Test Title');
  });
});
```

**Service Test Template**:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MyService } from './my-service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService]
    });

    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();  // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load data and update signal', () => {
    const mockData = [{id: '1', name: 'Test'}];

    service.loadData().subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    expect(service.data()).toEqual(mockData);
    expect(service.dataCount()).toBe(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
ng test

# Run tests with coverage
ng test --code-coverage

# View coverage report
open coverage/index.html
```

**Coverage Target**: Minimum 80% for all new code.

---

## Working with Mock Services

The application uses mock services for local development (no GCP dependencies required).

### Datastore Mock Service

Located in `src/app/core/services/mock/datastore-mock.service.ts`

**Features**:
- In-memory storage using signals
- Persistent across page refreshes via `localStorage`
- Simulates async operations (50-100ms delay)
- Auto-generates IDs

**Usage**:
```typescript
// Automatically injected based on environment in app.config.ts
private libraryService = inject(LibraryService);

// Works exactly like production service
this.libraryService.getAll().subscribe(libraries => {
  console.log('Libraries:', libraries);
});
```

**Seeding Test Data**:

Add initial data in `datastore-mock.service.ts`:

```typescript
export class DatastoreMockService {
  private initializeTestData(): void {
    const testLibrary: Library = {
      id: 'test-lib-1',
      name: 'Test Library',
      description: 'A test library for development',
      location: 'Building A, Floor 2',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'mock-user-1'
    };

    this.storage.set('Library', [testLibrary]);
  }
}
```

### Auth Mock Service

Located in `src/app/core/services/mock/auth-mock.service.ts`

**Features**:
- Provides hard-coded current user
- Always returns authenticated
- User signal for reactive UI updates

**Current User**:
```typescript
{
  id: 'mock-user-1',
  name: 'Demo User',
  email: 'demo@booksfeir.com',
  avatar: '/assets/default-avatar.png',
  role: UserRole.USER
}
```

---

## Common Tasks

### 1. Add a New Angular Material Component

```typescript
// Import the Material module
import { MatCardModule } from '@angular/material/card';

@Component({
  // ...
  imports: [MatCardModule]  // Add to component imports
})
```

**Commonly Used Material Modules**:
- `MatButtonModule` - Buttons
- `MatCardModule` - Cards
- `MatListModule` - Lists
- `MatToolbarModule` - Toolbar
- `MatIconModule` - Icons
- `MatFormFieldModule` - Form fields
- `MatInputModule` - Text inputs
- `MatSelectModule` - Dropdowns
- `MatDialogModule` - Dialogs
- `MatChipsModule` - Chips (status indicators)

### 2. Open a Material Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import { inject } from '@angular/core';

export class MyComponent {
  private dialog = inject(MatDialog);

  openDialog(): void {
    const dialogRef = this.dialog.open(MyDialogComponent, {
      width: '400px',
      data: { title: 'Edit Library' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog result:', result);
      }
    });
  }
}
```

### 3. Use Reactive Forms

```typescript
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule]
})
export class MyFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['']
  });

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      console.log('Form value:', value);
    }
  }
}
```

### 4. Navigate Programmatically

```typescript
import { Router } from '@angular/router';

export class MyComponent {
  private router = inject(Router);

  goToLibrary(id: string): void {
    this.router.navigate(['/library', id]);
  }
}
```

### 5. Use Google Books API

```typescript
import { GoogleBooksService } from './core/services/google-books.service';

export class BookSearchComponent {
  private googleBooks = inject(GoogleBooksService);

  searchQuery = signal('');
  searchResults = signal<Partial<Book>[]>([]);

  onSearch(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      this.googleBooks.search(query, this.currentLibraryId()).subscribe({
        next: results => this.searchResults.set(results),
        error: () => this.searchResults.set([])  // Silent failure
      });
    }
  }
}
```

---

## Debugging Tips

### Zoneless Mode Issues

If change detection isn't working:

1. **Ensure OnPush change detection** on all components
2. **Use signals** for reactive state (not plain variables)
3. **Call `fixture.detectChanges()`** manually in tests
4. **Check for forgotten subscriptions** (use `takeUntilDestroyed()`)

### Signal Debugging

```typescript
// Log signal changes in development
effect(() => {
  console.log('Data changed:', this.data());
});
```

### Material Component Issues

1. **Check imports**: Ensure Material module is in component's `imports` array
2. **Check theme**: Verify `@angular/material` theme is imported in `styles.scss`
3. **Check harnesses**: Use Material harnesses in tests, not direct DOM queries

---

## Code Quality Checks

Before committing:

```bash
# Run linter
npm run lint

# Run tests with coverage
npm run test:coverage

# Build production bundle
npm run build

# All checks must pass before creating PR
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `ng serve` | Start dev server |
| `ng test` | Run tests in watch mode |
| `ng build` | Build for production |
| `ng generate component <name> --standalone` | Generate standalone component |
| `ng generate service <name>` | Generate service |
| `ng lint` | Run linter |
| `npm run test:coverage` | Run tests with coverage report |

---

## Resources

- **Feature Spec**: `specs/001-library-homepage/spec.md`
- **Data Model**: `specs/001-library-homepage/data-model.md`
- **Research**: `specs/001-library-homepage/research.md`
- **Service Contracts**: `specs/001-library-homepage/contracts/`
- **Project Constitution**: `.specify/memory/constitution.md`
- **Angular Docs**: https://angular.dev
- **Material Docs**: https://material.angular.io
- **Context7 (in Claude Code)**: Use Context7 MCP tools for live documentation

---

## Getting Help

1. **Check the spec**: `specs/001-library-homepage/spec.md` for requirements
2. **Check research**: `specs/001-library-homepage/research.md` for technical decisions
3. **Check contracts**: `specs/001-library-homepage/contracts/` for service interfaces
4. **Ask the team**: Create a discussion in GitHub Issues
5. **Use Context7**: Query Angular/Material documentation via Context7 MCP in Claude Code

---

## Next Steps

After setup:

1. **Read the spec**: Understand the feature requirements
2. **Review data model**: Familiarize yourself with entities and relationships
3. **Explore codebase**: Navigate through existing components
4. **Check task list**: `specs/001-library-homepage/tasks.md` (created by `/speckit.tasks`)
5. **Pick a task**: Start with foundational components (models, services)

Happy coding! 🚀