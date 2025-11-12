# Implementation Plan: Library Management Homepage

**Branch**: `001-library-homepage` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-library-homepage/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build the Booksfeir library management homepage featuring multiple libraries with CRUD operations, book management within libraries, Google Books API integration for search fallback with purchase request workflow, and book borrowing/return tracking. The application uses Angular 20 with standalone components, signals for state management, Angular Material for UI, GCP Datastore for persistence, and runs in zoneless mode.

## Technical Context

**Language/Version**: TypeScript 5.9.x with strict mode
**Primary Dependencies**: Angular 20.x (standalone components, signals), Angular Material 20.x, @angular/common/http for API calls, selector components start with 'sfeir-'
**Storage**: GCP Datastore (mocked for local development)
**Testing**: Karma test runner with Jasmine framework, Angular Testing Library patterns, component harnesses
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend-focused Angular SPA)
**Performance Goals**: Homepage load <2s, search results <3s, task completion 95% success rate, cover images <2s
**Constraints**: Zoneless operation (no zone.js), OnPush change detection, 80% test coverage minimum, responsive design (mobile/tablet/desktop)
**Scale/Scope**: MVP with 5 user stories (view libraries, manage libraries, manage books, search with Google Books fallback, borrow/return workflow)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

✅ **Clean Code Foundation**: Components follow SRP, services handle single responsibilities, descriptive naming throughout
✅ **Modern Angular Architecture**: Standalone components, signals for state, `input()`/`output()` functions, `inject()` DI, OnPush change detection, native control flow, zoneless operation
✅ **TypeScript Strict Mode**: Strict compilation enabled, no `any` types, explicit interfaces for all models
✅ **Angular Material Design System**: All UI components use Angular Material, responsive design, accessibility built-in
✅ **Comprehensive Testing**: Karma + Jasmine with 80% coverage target, component harnesses, unit + integration tests
✅ **Simple and Intuitive UX/UI**: Progressive disclosure (purchase requests separate from core flow), clear feedback for all actions
✅ **Context7 Documentation Integration**: Will use Context7 for Angular Material components, Google Books API patterns, GCP Datastore mocking
✅ **Mock-First Development**: GCP Datastore mocked locally, GCP Identity Federation mocked, Google Books API integration with error handling

### Technology Constraints Compliance

✅ **Required Stack**:
- Angular 20.x with standalone components ✓
- Angular Material 20.x ✓
- Karma + Jasmine testing ✓
- TypeScript 5.9.x strict mode ✓
- Angular Signals for state (no external state libraries) ✓
- Zoneless change detection ✓
- Context7 MCP for documentation ✓
- GCP Datastore (mocked) ✓
- GCP Identity Federation (mocked) ✓
- Google Books API v1 ✓

✅ **Prohibited Patterns**: None used
- No NgModules (except app config)
- No zone.js dependency
- No `any` types
- No structural directives
- No decorator-based inputs/outputs
- Reactive forms only
- No `ngClass`/`ngStyle`
- No constructor injection

### Gate Status: **PASSED** ✅

All constitution requirements met. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── core/
│   │   ├── models/              # TypeScript interfaces for all entities
│   │   │   ├── library.model.ts
│   │   │   ├── book.model.ts
│   │   │   ├── borrow-transaction.model.ts
│   │   │   └── purchase-request.model.ts
│   │   ├── services/            # Business logic and data services
│   │   │   ├── library.service.ts
│   │   │   ├── book.service.ts
│   │   │   ├── borrow.service.ts
│   │   │   ├── purchase-request.service.ts
│   │   │   ├── google-books.service.ts
│   │   │   └── mock/            # Mock implementations for local dev
│   │   │       ├── datastore-mock.service.ts
│   │   │       └── auth-mock.service.ts
│   │   └── guards/              # Route guards
│   │       └── auth.guard.ts
│   ├── features/
│   │   ├── home/                # Homepage with library list
│   │   │   ├── home.component.ts
│   │   │   └── home.component.spec.ts
│   │   ├── library-detail/      # Single library view with books
│   │   │   ├── library-detail.component.ts
│   │   │   ├── library-detail.component.spec.ts
│   │   │   ├── components/
│   │   │   │   ├── book-list/
│   │   │   │   ├── book-form/
│   │   │   │   └── book-search/
│   │   │   └── library-detail.routes.ts
│   │   ├── library-form/        # Create/Edit library
│   │   │   ├── library-form.component.ts
│   │   │   └── library-form.component.spec.ts
│   │   └── shared/              # Shared UI components
│   │       ├── navigation/
│   │       │   ├── navigation.component.ts
│   │       │   └── navigation.component.spec.ts
│   │       └── dialogs/
│   │           ├── confirm-dialog/
│   │           └── purchase-request-dialog/
│   ├── app.component.ts         # Root component
│   ├── app.config.ts            # Application providers/config
│   └── app.routes.ts            # Top-level routes
├── assets/                      # Static assets (logo, etc.)
└── environments/                # Environment configs

src/app/**/*.spec.ts             # Unit tests co-located with components
```

**Structure Decision**: Angular SPA with feature-based organization. Core module contains shared models/services, features module contains routable feature components. Each feature is self-contained with its own components, sub-components, and routes. Mock services in core/services/mock enable local development without GCP dependencies.

## Complexity Tracking

No constitution violations. This section intentionally left empty.

---

## Phase 0: Research (Complete)

**Status**: ✅ Complete
**Date**: 2025-11-12

**Output**: [`research.md`](./research.md)

**Key Decisions**:
1. **Angular Material Components**: MatCard, MatList, MatDialog, MatToolbar, MatButton for UI
2. **Google Books API**: REST integration with silent failure on errors, max 5 results sorted by newest
3. **GCP Datastore Mocking**: In-memory mock service with localStorage persistence for local dev
4. **Signal-Based State Management**: Service-level signals with computed state, no external state libraries
5. **Zoneless Operation**: `provideExperimentalZonelessChangeDetection()` with OnPush change detection
6. **Routing**: Lazy-loaded feature routes with hierarchical structure
7. **Forms**: Reactive Forms with built-in validators and Material form fields
8. **Images**: `NgOptimizedImage` for performance (with fallback to regular `<img>` for base64)
9. **Testing**: Karma + Jasmine with Material harnesses, 80% coverage target
10. **Auth Mock**: Hard-coded user with signal-based current user context

**All unknowns resolved** - no NEEDS CLARIFICATION remaining.

---

## Phase 1: Design & Contracts (Complete)

**Status**: ✅ Complete
**Date**: 2025-11-12

**Outputs**:
- [`data-model.md`](./data-model.md) - Complete TypeScript interfaces for all entities
- [`contracts/`](./contracts/) - Service contract definitions
  - [`library-service.contract.ts`](./contracts/library-service.contract.ts)
  - [`book-service.contract.ts`](./contracts/book-service.contract.ts)
  - [`borrow-service.contract.ts`](./contracts/borrow-service.contract.ts)
  - [`google-books-service.contract.ts`](./contracts/google-books-service.contract.ts)
  - [`purchase-request-service.contract.ts`](./contracts/purchase-request-service.contract.ts)
- [`quickstart.md`](./quickstart.md) - Developer onboarding guide
- `.claude/CLAUDE.md` - Updated agent context (via update-agent-context.sh)

**Data Model Summary**:
- **5 Core Entities**: Library, Book, BorrowTransaction, PurchaseRequest, User
- **3 Enums**: BookStatus, BorrowStatus, PurchaseRequestStatus, UserRole
- **Type Guards**: Runtime type checking for strict mode compliance
- **DTO Mappings**: Google Books API response to internal Book model
- **Form Models**: LibraryFormValue, BookFormValue for Reactive Forms

**Service Contracts**:
- **LibraryService**: CRUD operations with delete validation (borrowed books check)
- **BookService**: CRUD operations with library association and search
- **BorrowService**: Borrow/return workflow with status tracking
- **GoogleBooksService**: External API integration with silent failure handling
- **PurchaseRequestService**: Purchase request creation and management (admin review out of MVP scope)

**Quickstart Guide Includes**:
- Prerequisites and setup instructions
- Project structure walkthrough
- Development workflow (component/service/test creation)
- Mock service usage and test data seeding
- Common tasks with code examples
- Debugging tips for zoneless mode and signals
- Code quality checks and useful commands

---

## Post-Phase 1 Constitution Verification

Re-checking constitution compliance after design decisions:

### Core Principles ✅

- **Clean Code Foundation**: Services follow SRP (one service per entity), models separated from logic
- **Modern Angular Architecture**: All contracts use signals, `input()`/`output()`, `inject()`, OnPush, zoneless
- **TypeScript Strict Mode**: All interfaces fully typed, no `any`, type guards for runtime checks
- **Angular Material**: All UI components use Material, component harnesses for testing
- **Comprehensive Testing**: Test patterns documented, harnesses used, 80% coverage enforced
- **Simple UX/UI**: Progressive disclosure (purchase requests separate), clear feedback patterns
- **Context7 Integration**: Used extensively in research for Material and Google Books docs
- **Mock-First Development**: Complete mock strategy with localStorage, injectable abstractions

### Technology Constraints ✅

All required stack elements present:
- Angular 20.x standalone components with signals ✓
- Angular Material 20.x ✓
- Karma + Jasmine ✓
- TypeScript 5.9.x strict mode ✓
- Zoneless change detection ✓
- GCP Datastore (mocked) ✓
- GCP Identity Federation (mocked) ✓
- Google Books API v1 ✓

No prohibited patterns:
- No NgModules ✓
- No zone.js ✓
- No `any` types ✓
- No structural directives ✓
- No decorator-based inputs/outputs ✓
- No constructor injection ✓

### Final Gate Status: **PASSED** ✅

All design decisions comply with constitution requirements. Ready for Phase 2 (Task Generation).

---

## Complexity Tracking

No constitution violations. This section intentionally left empty.
