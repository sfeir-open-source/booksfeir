# Research: User Role Management

**Feature**: 002-user-role-management
**Date**: 2025-11-19
**Status**: Complete

## Purpose

This document consolidates research findings for implementing the user role management feature, focusing on Angular best practices, Angular Material patterns, and GCP Datastore mocking strategies.

## Research Areas

### 1. Angular Signals for Role State Management

**Decision**: Use signals with computed() for derived role state

**Rationale**:

- Signals provide fine-grained reactivity without zone.js dependency
- `computed()` automatically tracks dependencies and updates when source signals change
- Simpler than RxJS for straightforward state management
- Better performance with OnPush change detection

**Implementation Pattern**:

```typescript
// Service
currentUser = signal<User | null>(null);
canEditRoles = computed(() => this.currentUser()?.role === 'admin');

// Component
users = signal<User[]>([]);
filteredUsers = computed(() =>
  this.users().filter(u => u.id !== this.currentUser()?.id)
);
```

**Alternatives Considered**:

- RxJS BehaviorSubject: More complex, requires zone.js or manual change detection
- NgRx/NGRX Signal Store: Overkill for this feature scope

**References**: Angular Signals documentation (v20+)

---

### 2. Angular Material Component Harnesses for Testing

**Decision**: Use Material component harnesses (MatSelectHarness, MatSnackBarHarness) for all Material component tests

**Rationale**:

- Component harnesses provide stable testing APIs that don't break with internal Material changes
- Harnesses abstract away implementation details (DOM structure, CSS classes)
- Better test readability and maintainability
- Official Angular Material testing approach

**Implementation Pattern**:

```typescript
import {MatSelectHarness} from '@angular/material/select/testing';
import {HarnessLoader} from '@angular/cdk/testing';

it('should allow admin to change user role', async () => {
  const select = await loader.getHarness(MatSelectHarness);
  await select.open();
  await select.clickOptions({text: 'librarian'});
  expect(component.selectedRole()).toBe('librarian');
});
```

**Alternatives Considered**:

- Direct DOM querying: Fragile, breaks with Material updates
- TestBed ComponentFixture only: Misses Material-specific interactions

**References**: Angular Material Testing documentation, Component Harness Guide

---

### 3. GCP Datastore Mocking for Local Development

**Decision**: Create mock Datastore service implementing abstract DatastoreService interface, using in-memory Map for storage

**Rationale**:

- Enables offline development without GCP project setup
- Faster test execution (no network calls)
- Predictable test data
- Service interface abstraction prevents vendor lock-in

**Implementation Pattern**:

```typescript
// datastore.service.ts (abstract interface)
export abstract class DatastoreService {
  abstract get<T>(kind: string, id: string): Promise<T | null>;
  abstract query<T>(kind: string, filters?: Filter[]): Promise<T[]>;
  abstract save<T>(kind: string, entity: T): Promise<void>;
  abstract delete(kind: string, id: string): Promise<void>;
}

// datastore-mock.service.ts
@Injectable()
export class DatastoreMockService implements DatastoreService {
  private store = new Map<string, Map<string, unknown>>();

  async get<T>(kind: string, id: string): Promise<T | null> {
    const kindStore = this.store.get(kind);
    return (kindStore?.get(id) as T) || null;
  }
  // ... other methods
}

// app.config.ts
providers: [
  {
    provide: DatastoreService,
    useClass: environment.production
      ? DatastoreProductionService
      : DatastoreMockService
  }
]
```

**Alternatives Considered**:

- Direct GCP Datastore calls: Requires cloud setup, slow tests
- Local Datastore emulator: Extra setup complexity, still requires network
- JSON file storage: Doesn't simulate async behavior, harder to test error scenarios

**References**: GCP Datastore documentation, Angular DI patterns

---

### 4. Optimistic Locking for Concurrent Role Edits

**Decision**: Last-write-wins with client-side timestamp comparison

**Rationale**:

- Simpler than pessimistic locking (no lock management)
- Acceptable for low-conflict scenarios (role changes are infrequent)
- Audit trail preserves both conflicting changes for review
- No distributed lock coordination needed

**Implementation Pattern**:

```typescript
async
assignRole(userId
:
string, newRole
:
Role
):
Promise < void > {
  const user = await this.datastore.get<User>('User', userId);
  if(!
user
)
throw new Error('User not found');

user.role = newRole;
user.updatedAt = new Date();
user.updatedBy = this.currentUserId;

await this.datastore.save('User', user);
await this.audit.log({
  action: 'role_change',
  userId,
  oldRole: user.role,
  newRole,
  timestamp: user.updatedAt
});
}
```

**Alternatives Considered**:

- Pessimistic locking: Complex, requires lock timeout handling
- Version-based optimistic locking: More complex, requires version tracking
- Conflict detection UI: Better UX but higher implementation cost

**References**: Distributed systems patterns, GCP Datastore transactions

---

### 5. Zoneless Change Detection with Signals

**Decision**: Use `provideExperimentalZonelessChangeDetection()` and trigger change detection via signal updates

**Rationale**:

- Constitution requirement (VIII. Modern Angular Architecture)
- Improved performance (no zone.js overhead)
- Signals automatically notify change detection
- Aligns with Angular's future direction

**Implementation Pattern**:

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // ... other providers
  ]
});

// Component (signals auto-trigger CD)
roleChanged(newRole: Role) {
  this.selectedRole.set(newRole);  // Triggers change detection automatically
}
```

**Alternatives Considered**:

- Zone.js with ChangeDetectorRef.markForCheck(): Violates constitution
- Manual ChangeDetectorRef.detectChanges(): Error-prone, easy to miss

**References**: Angular Zoneless documentation, Angular 20 migration guide

---

### 6. Audit Log Retention and Cleanup

**Decision**: Scheduled background job (daily cron) to delete audit entries older than 1 month

**Rationale**:

- Prevents unbounded storage growth
- Meets 1-month retention requirement from clarifications
- Background processing doesn't impact user experience
- Standard pattern for time-based data cleanup

**Implementation Pattern**:

```typescript
// audit-cleanup.service.ts
@Injectable()
export class AuditCleanupService {
  async cleanupOldEntries(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);

    const oldEntries = await this.datastore.query<AuditEntry>('AuditEntry', [
      { field: 'timestamp', op: '<', value: cutoffDate }
    ]);

    for (const entry of oldEntries) {
      await this.datastore.delete('AuditEntry', entry.id);
    }
  }
}

// Schedule via Cloud Scheduler or App Engine cron
```

**Alternatives Considered**:

- Delete on read (lazy deletion): Inconsistent cleanup timing
- TTL-based deletion (Datastore TTL): Not available in all GCP Datastore tiers
- Never delete: Violates retention requirement, unbounded costs

**References**: GCP Cloud Scheduler, cron patterns

---

## Summary

All research areas resolved with clear implementation patterns. No blocking unknowns remain. Key decisions:

1. Signals + computed() for state management
2. Material component harnesses for testing
3. Mock Datastore service with in-memory storage
4. Last-write-wins optimistic locking
5. Zoneless change detection with signals
6. Scheduled daily audit log cleanup

Ready to proceed to Phase 1 (Design & Contracts).
