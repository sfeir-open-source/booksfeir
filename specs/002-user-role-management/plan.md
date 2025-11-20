# Implementation Plan: User Role Management

**Branch**: `002-user-role-management` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-user-role-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a role-based access control system allowing administrators to assign and manage user roles (user, librarian, admin). The system prevents self-role modification, supports librarian-to-library relationships via a join table, includes a 1-month audit trail, and applies role changes on next login. Technical approach uses Angular signals for state management, Angular Material components for UI, and GCP Datastore for persistence with mock services for local development.

## Technical Context

**Language/Version**: TypeScript 5.9.x with strict mode
**Primary Dependencies**: Angular 20.x (standalone components, signals), Angular Material 20.x, RxJS 7.x
**Storage**: GCP Datastore (NoSQL managed database, mocked for local development)
**Testing**: Karma test runner with Jasmine framework
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - modern versions)
**Project Type**: Web application (Angular SPA)
**Performance Goals**: < 30 seconds for role assignment UI operations (click-to-confirmation round-trip), < 100ms for role lookup/display
**Constraints**: Zoneless operation (no zone.js), OnPush change detection, 80% test coverage minimum
**Scale/Scope**: Support 1000+ concurrent users, handle 10,000+ user accounts, 5 entity types (User, Role, RoleAssignment, Library, LibraryAssignment, AuditEntry), audit log retention 1 month

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle                       | Compliance | Notes                                                                                                      |
|---------------------------------|------------|------------------------------------------------------------------------------------------------------------|
| I. Clean Code Foundation        | ✅ PASS     | SRP for components/services, DRY through shared role utilities, clear naming                               |
| II. Modern Angular Architecture | ✅ PASS     | Standalone components, signals for state, inject(), OnPush, native control flow, zoneless                  |
| III. TypeScript Strict Mode     | ✅ PASS     | Strict mode enabled, explicit interfaces for User/Role/RoleAssignment/Library/LibraryAssignment/AuditEntry |
| IV. Angular Material Design     | ✅ PASS     | Mat-select for role dropdown, mat-list for users, mat-snackbar for feedback, responsive                    |
| V. Comprehensive Testing        | ✅ PASS     | Karma+Jasmine, 80% coverage target, component harnesses for Material components                            |
| VI. Simple and Intuitive UX/UI  | ✅ PASS     | Inline error messages, clear success feedback, progressive disclosure for audit trail                      |
| VII. Context7 Documentation     | ✅ PASS     | Will use Context7 for Angular Material harness patterns and GCP Datastore mocking                          |
| VIII. Mock-First Development    | ✅ PASS     | Mock Datastore service for local development, abstracted via service interface                             |

**Gate Status**: ✅ PASSED - No violations, all constitution principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/002-user-role-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── core/
│   ├── models/
│   │   ├── user.model.ts              # User entity interface
│   │   ├── role.model.ts              # Role enum (user, librarian, admin)
│   │   ├── role-assignment.model.ts   # Role assignment with audit metadata
│   │   ├── library.model.ts           # Library entity (id, name, location)
│   │   ├── library-assignment.model.ts # LibraryAssignment join table
│   │   └── audit-entry.model.ts       # Audit log entry interface
│   ├── services/
│   │   ├── mock/
│   │   │   └── datastore-mock.service.ts    # Mock GCP Datastore for local dev
│   │   ├── datastore.service.ts             # Datastore service interface
│   │   ├── user-role.service.ts             # Role assignment business logic
│   │   └── audit.service.ts                 # Audit trail management
│   └── guards/
│       └── admin-role.guard.ts        # Route guard for admin-only access
├── features/
│   └── user-management/               # NEW: User role management feature
│       ├── components/
│       │   ├── user-list/             # List of users with role dropdowns
│       │   ├── role-selector/         # Reusable role dropdown component
│       │   └── audit-log/             # Audit trail display component
│       ├── user-management.component.ts     # Main container component
│       └── user-management.routes.ts        # Feature routes (lazy-loaded)
└── shared/                            # Existing shared components/utilities

src/app/app.routes.ts                  # Add lazy route to user-management
```

**Structure Decision**: Angular SPA with feature-based structure. New `user-management` feature module under `features/` following existing project patterns. Core models and services in `core/` for reusability. Mock Datastore service enables local development without GCP dependencies.

## Complexity Tracking

N/A - No constitution violations to justify.
