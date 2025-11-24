# Implementation Tasks: User Role Management

**Feature**: 002-user-role-management
**Branch**: `002-user-role-management`
**Date**: 2025-11-19

## Overview

This document contains all implementation tasks for the user role management feature, organized by user story for independent, incremental delivery. Each user story phase is independently testable and delivers user value.

**Total Tasks**: 95
**User Stories**: 4 (P1-P3)
**Parallelization Opportunities**: 21 tasks marked [P]

## Implementation Strategy

**MVP Scope**: User Story 1 (Admin Assigns User Role) - Delivers basic role assignment functionality

**Incremental Delivery**:

1. Phase 1-2: Setup and foundation (blocking prerequisites)
2. Phase 3: US1 - Basic role assignment (MVP)
3. Phase 4: US2 - Librarian role with library assignments
4. Phase 5: US3 - Admin role delegation
5. Phase 6: US4 - Audit trail
6. Phase 7: Polish and cross-cutting concerns

Each phase is independently deployable and testable.

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project structure and install dependencies

### Tasks

- [X] T001 Verify Angular 20.x and Angular Material 20.x are installed (check package.json)
- [X] T002 Verify TypeScript 5.9.x with strict mode is configured (check tsconfig.json)
- [X] T002a Verify vite.config.ts exists with @analogjs/vite-plugin-angular and Vitest configuration
- [X] T002b Verify test-setup.ts exists for zoneless TestBed initialization (@analogjs/vitest-angular/setup-snapshots)
- [X] T002c Verify tsconfig.spec.json includes Vitest global types (vitest/globals)
- [X] T002d Verify angular.json test builder uses @analogjs/vitest-angular:test
- [X] T003 Verify zoneless change detection is enabled in src/main.ts (provideExperimentalZonelessChangeDetection)
- [X] T004 Create core models directory structure: src/app/core/models/
- [X] T005 Create core services directory structure: src/app/core/services/ and src/app/core/services/mock/
- [X] T006 Create core guards directory structure: src/app/core/guards/
- [X] T007 Create user management feature directory: src/app/features/user-management/
- [X] T008 Create user management components directory: src/app/features/user-management/components/

**Completion Criteria**: All directory structures exist, dependencies verified

---

## Phase 2: Foundational Layer

**Goal**: Implement shared models, services, and abstractions needed by all user stories

### Models

- [X] T009 [P] Create Role enum in src/app/core/models/role.model.ts with USER, LIBRARIAN, ADMIN values
- [X] T010 [P] Create User interface in src/app/core/models/user.model.ts with id, email, name, role, timestamps (no libraryIds - uses LibraryAssignment join table)
- [X] T011 [P] Create RoleAssignment interface in src/app/core/models/role-assignment.model.ts
- [X] T011a [P] Create Library interface in src/app/core/models/library.model.ts with id, name, location, createdAt
- [X] T011b [P] Create LibraryAssignment interface in src/app/core/models/library-assignment.model.ts with id, userId, libraryId, assignedAt, assignedBy
- [X] T012 [P] Create AuditEntry interface in src/app/core/models/audit-entry.model.ts

### Services - Datastore Abstraction

- [X] T013 Create abstract DatastoreService class in src/app/core/services/datastore.service.ts with get, query, save, delete, batchSave, batchDelete methods
- [X] T014 Implement DatastoreMockService in src/app/core/services/mock/datastore-mock.service.ts with in-memory Map storage and seed data (admin1, lib1, user1)
- [X] T014a Implement default role assignment in DatastoreMockService.save() for User entities (set role = Role.USER if role is undefined)
- [X] T014b Create unit test for DatastoreMockService.save() validating default USER role assignment for new users without explicit role (validates FR-011)
- [X] T015 Configure DI provider in src/app/app.config.ts to use DatastoreMockService for development

### Route Guard

- [X] T016 Create AdminRoleGuard in src/app/core/guards/admin-role.guard.ts using inject() and canActivate pattern

### Permission Service

- [X] T016a [P] Create RolePermissionService in src/app/core/services/role-permission.service.ts with canAccessFeature(userId, feature) method
- [X] T016b Add permission checks: LIBRARIAN can access library management, USER can access basic features, ADMIN can access all
- [X] T016c Integrate RolePermissionService into feature guards (user-only and librarian-only routes)

**Completion Criteria**: Models defined, mock datastore functional with seed data and default role assignment, admin guard created, permission service implemented

**Dependencies**: None (foundational)

---

## Phase 3: User Story 1 - Admin Assigns User Role (P1) 🎯 MVP

**Goal**: Enable admins to assign "user" role to other users

**Independent Test**: Admin can log in, view user list (excluding self), select "user" from dropdown, save, and see success confirmation

### Services

- [X] T017 [US1] Implement UserRoleService in src/app/core/services/user-role.service.ts with assignRole, getUsersExcept, getUser, isAdmin methods using signals
- [X] T018 [US1] Add validation logic to UserRoleService.assignRole: check admin role, prevent self-modification, validate target user exists

### Components - Role Selector

- [X] T019 [P] [US1] Generate role-selector component: ng generate component features/user-management/components/role-selector --standalone
- [X] T020 [US1] Implement role-selector component with mat-select, input() for currentRole and disabled signals, output() for roleChange event
- [X] T021 [US1] Add OnPush change detection and host bindings to role-selector component
- [X] T022 [US1] Create role-selector component test spec with MatSelectHarness testing role changes

### Components - User List

- [X] T023 [P] [US1] Generate user-list component: ng generate component features/user-management/components/user-list --standalone
- [X] T024 [US1] Implement user-list component with mat-list, signals for users, inject UserRoleService
- [X] T025 [US1] Add filtering logic to exclude current admin user using computed()
- [X] T026 [US1] Integrate role-selector into each list item with disabled state for self
- [X] T027 [US1] Implement role change handler with MatSnackBar for success/error feedback
- [X] T028 [US1] Add inline error message display below role selector
- [X] T029 [US1] Create user-list component test spec with harnesses for mat-list and role-selector

### Container & Routes

- [X] T030 [US1] Generate user-management container component: ng generate component features/user-management/user-management --standalone
- [X] T031 [US1] Implement user-management component to load users and compose user-list
- [X] T032 [US1] Create user-management.routes.ts with canActivate: [AdminRoleGuard]
- [X] T033 [US1] Add lazy route to src/app/app.routes.ts: { path: 'user-management', loadChildren: () => import('./features/user-management/user-management.routes') }

### Integration

- [X] T034 [US1] Test end-to-end flow: admin login → navigate to /user-management → assign user role → verify success message
- [X] T035 [US1] Verify role change persists in DatastoreMockService
- [X] T036 [US1] Verify self-modification prevention (role selector disabled for current admin)
- [X] T036a [US1] Test permission enforcement: verify user role cannot access admin or librarian features
- [X] T036b [US1] Test admin session persistence: demote active admin → verify they retain admin permissions until logout (validates FR-014)

**Completion Criteria**:

- Admin can view all users except themselves
- Admin can assign "user" role via dropdown
- Success message displays on save
- Self-modification blocked
- 80% test coverage for US1 components and services

**Dependencies**: Phase 1, Phase 2

**MVP Delivery**: ✅ This phase delivers the minimum viable product

---

## Phase 4: User Story 2 - Admin Assigns Librarian Role (P2)

**Goal**: Enable librarian role assignment with library management

**Independent Test**: Admin assigns "librarian" role and assigns libraries to that user

### Services Enhancement

- [X] T037 [US2] Extend UserRoleService with assignLibraries and getAssignedLibraries methods
- [X] T038 [US2] Add library validation to assignLibraries (check library IDs exist in datastore)

### Components Enhancement

- [X] T039 [US2] Update role-selector to include "Librarian" option in mat-select
- [X] T040 [US2] Add library assignment UI to user-list (conditional display when role === LIBRARIAN)
- [X] T041 [US2] Implement library multi-select using mat-select with multiple attribute
- [X] T042 [US2] Add tests for librarian role assignment and library association

### Integration

- [X] T043 [US2] Test librarian role assignment → library assignment → verify LibraryAssignment records created in datastore
- [X] T044 [US2] Verify changing from librarian to user/admin role preserves LibraryAssignment records in database (they are ignored when user is not a librarian per FR-013)

**Completion Criteria**:

- Admin can assign "librarian" role
- Admin can assign multiple libraries to librarian
- Changing role from librarian preserves LibraryAssignment records in database (they are ignored for non-librarian users per FR-013)
- Tests cover librarian-specific logic including role change preservation

**Dependencies**: Phase 3 (US1)

---

## Phase 5: User Story 3 - Admin Assigns Admin Role (P3)

**Goal**: Enable admin role delegation for administrative tasks

**Independent Test**: Admin promotes another user to admin, new admin can manage roles (except their own)

### Services Enhancement

- [X] T045 [US3] Add "last admin check" validation to UserRoleService.assignRole (prevent demoting last admin)
- [X] T046 [US3] Implement countAdmins() helper method in UserRoleService

### Components Enhancement

- [X] T047 [US3] Update role-selector to include "Admin" option in mat-select
- [X] T048 [US3] Add validation error display for "Cannot demote last admin" scenario
- [X] T049 [US3] Add tests for admin role assignment and last admin protection

### Integration

- [X] T050 [US3] Test admin role assignment → new admin logs in → can manage other users' roles
- [X] T051 [US3] Test last admin protection: attempt to demote only admin → see error message
- [X] T052 [US3] Verify new admin cannot modify their own role

**Completion Criteria**:

- Admin can promote users to admin role
- Last admin cannot be demoted
- New admins have full role management permissions
- Self-modification still blocked for new admins

**Dependencies**: Phase 3 (US1)

---

## Phase 6: User Story 4 - Role Change Audit Trail (P3)

**Goal**: Display audit trail of role changes for transparency

**Independent Test**: Admin makes role changes, views audit log showing timestamp, who changed, old/new roles

### Services

- [X] T053 [P] [US4] Implement AuditService in src/app/core/services/audit.service.ts with logRoleChange, getAuditTrail, cleanupOldEntries methods
- [X] T054 [US4] Integrate AuditService.logRoleChange into UserRoleService.assignRole (create audit entry on every role change)
- [X] T055 [US4] Implement audit cleanup logic in AuditService.cleanupOldEntries (delete entries older than 30 days)
- [X] T055a [US4] Configure audit cleanup scheduler: Add Cloud Scheduler job or cron configuration to run AuditService.cleanupOldEntries() daily at midnight (document in quickstart.md)

### Components

- [X] T056 [P] [US4] Generate audit-log component: ng generate component features/user-management/components/audit-log --standalone
- [X] T057 [US4] Implement audit-log component with mat-list displaying audit entries (timestamp, changedBy, oldRole, newRole)
- [X] T058 [US4] Add signal-based loading state and computed() for formatted audit entries
- [X] T059 [US4] Create expandable audit section in user-list (progressive disclosure)
- [X] T060 [US4] Add tests for audit-log component with mock audit data

### Integration

- [X] T061 [US4] Test role change creates audit entry in DatastoreMockService
- [X] T062 [US4] Test audit trail displays correctly for multiple role changes
- [X] T063 [US4] Test audit cleanup removes entries older than 30 days

**Completion Criteria**:

- Every role change creates audit entry
- Audit log visible in user profile/list
- Audit entries show timestamp, admin who made change, old/new roles
- Old entries (>30 days) automatically deleted via scheduled job
- Scheduler configuration documented
- Tests cover audit creation, display, and cleanup

**Dependencies**: Phase 3 (US1)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Final refinements, performance optimization, accessibility

### Performance & Optimization

- [X] T064 [P] Add virtual scrolling to user-list using CDK virtual-scroll-viewport (if >100 users)
- [X] T065 [P] Implement role change debouncing (prevent rapid-fire changes)
- [X] T066 Optimize signal dependencies (review computed() performance)

### Accessibility

- [X] T067 [P] Add ARIA labels to role-selector (aria-label="Assign role")
- [X] T068 [P] Add keyboard navigation support to user-list (tab through users, space to open dropdown)
- [X] T069 [P] Ensure color contrast meets WCAG AA standards for error messages

### Error Handling & Edge Cases

- [X] T070 [P] Add global error handler for datastore failures (network errors, timeout)
- [X] T071 Add loading state UI for user list (mat-progress-spinner)
- [X] T072 Implement optimistic UI updates with rollback on error
- [X] T073 Add empty state UI ("No users to manage")

### Documentation & Tests

- [X] T074 [P] Write integration test for complete role assignment workflow (admin → user → librarian → admin)
- [X] T075 [P] Add JSDoc comments to all public service methods
- [X] T076 Verify 80% test coverage using `npm run test:coverage`
- [X] T077 Update quickstart.md with example usage and screenshots

### Final Verification

- [X] T078 Run `npm run lint` and fix all errors
- [X] T079 Run `npm run build` and verify no warnings
- [ ] T080 Test on Chrome, Firefox, Safari, Edge (cross-browser compatibility)
- [ ] T081 Verify responsive design on mobile, tablet, desktop viewports

**Completion Criteria**:

- All tests passing
- 80%+ test coverage
- No lint errors
- Build successful
- Cross-browser and responsive verified
- Documentation complete

**Dependencies**: Phases 3, 4, 5, 6

---

## Dependency Graph

### Story Completion Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1 - MVP) ← Start here for MVP
    ├→ Phase 4 (US2 - Librarian) ← Independent
    ├→ Phase 5 (US3 - Admin) ← Independent
    └→ Phase 6 (US4 - Audit) ← Independent
         ↓
    Phase 7 (Polish) ← Requires all stories
```

**Independent Stories**: US2, US3, US4 can be implemented in parallel after US1 completes

**Blocking Dependencies**:

- Phases 1-2 must complete before any user story
- Phase 3 (US1) must complete before US2, US3, US4
- Phase 7 should wait for all user stories

---

## Parallel Execution Examples

### Phase 2 - Maximum Parallelization

Run T009-T012 (models) in parallel - all independent, different files:

```bash
# Terminal 1: Create Role enum
# Terminal 2: Create User interface
# Terminal 3: Create RoleAssignment interface
# Terminal 4: Create AuditEntry interface
```

### Phase 3 (US1) - Parallel Opportunities

After T017-T018 (services) complete, run T019-T020 (role-selector) and T023 (user-list generation) in parallel:

```bash
# Terminal 1: Implement role-selector component
# Terminal 2: Generate user-list component
```

### Phase 7 - Parallel Polish Tasks

Run T064, T065, T067, T068, T069, T070, T074, T075 in parallel - all independent:

```bash
# Multiple terminals can handle different polish tasks simultaneously
```

---

## Test Execution

### Unit Tests

Run after each phase:

```bash
npm test
```

### Coverage Report

Verify 80% coverage:

```bash
npm run test:coverage
```

### E2E Testing

Manual testing checklist per user story:

- **US1**: Admin assigns user role → verify success
- **US2**: Admin assigns librarian role + libraries → verify
- **US3**: Admin promotes to admin → new admin manages roles → verify
- **US4**: Make role changes → view audit log → verify entries

---

## Success Metrics

Track these metrics to validate implementation:

- **SC-001**: Role assignment completes in < 30 seconds (measure with browser dev tools)
- **SC-002**: 100% persistence rate (verify in datastore mock)
- **SC-003**: Zero self-modification instances (tested in T036)
- **SC-004**: Role changes apply on next login (tested in integration tests)
- **SC-005**: 95%+ success rate for role operations (monitor error logs)
- **SC-006**: Admin can manage 20+ users in < 5 minutes (manual timing test)

---

## Task Summary

| Phase          | Tasks  | [P] Tasks | User Story | Deliverable                           |
|----------------|--------|-----------|------------|---------------------------------------|
| 1 - Setup      | 12     | 0         | -          | Project structure + Vitest config     |
| 2 - Foundation | 15     | 7         | -          | Models, services, guards, permissions |
| 3 - US1 (MVP)  | 22     | 3         | P1         | Basic role assignment ✅               |
| 4 - US2        | 8      | 0         | P2         | Librarian role + libraries            |
| 5 - US3        | 8      | 0         | P3         | Admin role delegation                 |
| 6 - US4        | 12     | 2         | P3         | Audit trail + scheduler               |
| 7 - Polish     | 18     | 9         | -          | Production-ready                      |
| **Total**      | **95** | **21**    | **4**      | **Complete feature**                  |

---

## Notes

- Tasks marked [P] can run in parallel with other [P] tasks in the same phase
- Each phase is independently testable - verify completion criteria before moving to next phase
- MVP (Phase 3) is fully functional and deployable
- Constitution compliance verified throughout (strict types, OnPush, signals, zoneless, 80% coverage)
- Mock datastore enables offline development - no GCP setup required for implementation
