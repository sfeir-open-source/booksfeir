# Quickstart: User Role Management

**Feature**: 002-user-role-management
**Date**: 2025-11-19

## Overview

This guide helps developers quickly understand and start working on the user role management feature.

## What This Feature Does

Allows administrators to:

- View all users (except themselves)
- Assign roles (user, librarian, admin) to other users
- Assign libraries to librarians
- View audit trail of role changes
- Prevent self-role modification

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                     User Management UI                       │
│  (Angular Material components with signals)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────▼───────┐
         │ UserRoleService│
         │  (Business Logic)│
         └───────┬─────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│Datastore│  │ Audit  │  │ Auth   │
│Service  │  │Service │  │Service │
└────┬────┘  └────────┘  └────────┘
     │
┌────▼─────────────┐
│  GCP Datastore   │
│  (or Mock)       │
└──────────────────┘
```

## Key Files

### Models (src/app/core/models/)

- `user.model.ts` - User entity with role
- `role.model.ts` - Role enum (user, librarian, admin)
- `audit-entry.model.ts` - Audit trail entry

### Services (src/app/core/services/)

- `user-role.service.ts` - Role assignment logic
- `audit.service.ts` - Audit trail management
- `datastore.service.ts` - Database abstraction
- `mock/datastore-mock.service.ts` - Local development mock

### Components (src/app/features/user-management/)

- `user-list/` - List of users with role selectors
- `role-selector/` - Reusable role dropdown
- `audit-log/` - Audit trail display

## Quick Start Commands

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Tests

```bash
npm test
```

### 3. Run Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/user-management` (requires admin role).

### 4. Run with Mock Data

Mock Datastore service is automatically used in development mode. See `datastore-mock.service.ts` for sample data.

## Development Workflow

### Adding a New Role

1. Update `role.model.ts`:

```typescript
export enum Role {
  USER = 'user',
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
  MODERATOR = 'moderator'  // New role
}
```

2. Update `role-selector` component to include new option

3. Update business logic in `user-role.service.ts` if needed

4. Write tests for new role behavior

### Testing a Component

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';

describe('RoleSelectorComponent', () => {
  let component: RoleSelectorComponent;
  let fixture: ComponentFixture<RoleSelectorComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelectorComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should change role selection', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: 'Librarian' });

    expect(component.selectedRole()).toBe(Role.LIBRARIAN);
  });
});
```

### Mocking the Datastore Service

```typescript
// In test setup
const mockDatastore = {
  get: jasmine.createSpy('get').and.returnValue(Promise.resolve(mockUser)),
  query: jasmine.createSpy('query').and.returnValue(Promise.resolve([mockUser])),
  save: jasmine.createSpy('save').and.returnValue(Promise.resolve()),
  delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve())
};

TestBed.configureTestingModule({
  providers: [
    { provide: DatastoreService, useValue: mockDatastore }
  ]
});
```

## Common Tasks

### Task: Assign a Role to a User

```typescript
// In component
assignRole(userId: string, newRole: Role) {
  const userRoleService = inject(UserRoleService);
  const currentUserId = inject(AuthService).currentUserId();

  userRoleService.assignRole(currentUserId, userId, newRole)
    .then(result => {
      if (result.success) {
        // Show success message
        this.snackBar.open(`Role changed to ${newRole}`, 'Close', {
          duration: 3000
        });
      } else {
        // Show error
        this.snackBar.open(result.error, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
}
```

### Task: View Audit Trail

```typescript
// In component
loadAuditTrail(userId: string) {
  const auditService = inject(AuditService);

  auditService.getAuditTrail(userId, 10)
    .then(entries => {
      this.auditEntries.set(entries);
    });
}
```

### Task: Filter Users by Role

```typescript
// Using signals and computed
users = signal<User[]>([]);
selectedRoleFilter = signal<Role | 'all'>('all');

filteredUsers = computed(() => {
  const filter = this.selectedRoleFilter();
  if (filter === 'all') return this.users();
  return this.users().filter(u => u.role === filter);
});
```

## Debugging Tips

### Issue: Role change not reflected in UI

**Solution**: Ensure signal is updated:

```typescript
// ✅ Correct
this.users.update(users =>
  users.map(u => u.id === userId ? {...u, role: newRole} : u)
);

// ❌ Incorrect (mutates without signal update)
const user = this.users().find(u => u.id === userId);
user.role = newRole;
```

### Issue: Tests failing with "zone.js not loaded"

**Solution**: Application uses zoneless mode. Ensure tests manually trigger change detection:

```typescript
// In test
component.assignRole('user1', Role.LIBRARIAN);
fixture.detectChanges();  // Manual change detection
await fixture.whenStable();
```

### Issue: Mock datastore not returning data

**Solution**: Check mock service initialization in `datastore-mock.service.ts`:

```typescript
constructor() {
  this.seedInitialData();  // Ensure this is called
}
```

## Performance Considerations

### Signals vs. RxJS

- **Use signals** for simple state (current user, selected role)
- **Use RxJS** for complex async flows (HTTP requests, debouncing)
- **Use computed()** for derived state (filtered lists, permission checks)

### Change Detection

- All components use `OnPush` change detection
- Signal updates automatically trigger change detection
- Manual change detection not needed with signals

### Lazy Loading

- User management feature is lazy-loaded via routes
- Only loads when admin navigates to `/user-management`
- Reduces initial bundle size

## Production Deployment

### Audit Cleanup Scheduler Configuration

For production environments, configure a scheduled job to clean up audit entries older than 30 days:

#### Option 1: Google Cloud Scheduler (Recommended for GCP)

```bash
# Create Cloud Scheduler job
gcloud scheduler jobs create http audit-cleanup \
  --schedule="0 0 * * *" \
  --uri="https://your-app.com/api/audit/cleanup" \
  --http-method=POST \
  --oidc-service-account-email="scheduler@your-project.iam.gserviceaccount.com" \
  --location="us-central1"
```

#### Option 2: Cron Job (Unix/Linux)

Add to crontab:

```bash
# Run audit cleanup daily at midnight
0 0 * * * curl -X POST https://your-app.com/api/audit/cleanup
```

#### Option 3: Cloud Functions (Serverless)

```typescript
// functions/src/scheduled-cleanup.ts
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {AuditService} from './services/audit.service';

export const auditCleanup = onSchedule('every day 00:00', async (event) => {
  const auditService = new AuditService();
  const deletedCount = await auditService.cleanupOldEntries();
  console.log(`Cleaned up ${deletedCount} old audit entries`);
});
```

Deploy:

```bash
firebase deploy --only functions:auditCleanup
```

### Environment Variables

Configure the following environment variables for production:

```bash
# .env.production
DATASTORE_PROJECT_ID=your-gcp-project
DATASTORE_NAMESPACE=booksfeir-prod
AUDIT_RETENTION_DAYS=30
MAX_USERS_PER_PAGE=100
```

## Usage Examples

### Example 1: Admin Assigns Librarian Role

1. **Login as Admin**
  - Navigate to `http://localhost:4200`
  - Login with admin credentials (mock: admin@booksfeir.com)

2. **Navigate to User Management**
  - Click "User Management" in navigation menu
  - Or directly visit `/user-management`

3. **Assign Librarian Role**
  - Find user in the list
  - Click role dropdown next to user's name
  - Select "Librarian" from dropdown
  - System automatically saves and shows success message

4. **Assign Libraries to Librarian**
  - Library selector appears below role dropdown
  - Select one or more libraries from multi-select
  - Changes save automatically
  - Success message confirms library assignment

**Expected Result**: User now has librarian role and can manage assigned libraries.

### Example 2: View Audit Trail

1. **Expand Audit Log**
  - In user list, click "View Audit Log" button for any user
  - Expandable section shows role change history

2. **Audit Entry Details**
  - Each entry shows:
    - Timestamp (formatted as "2 days ago")
    - Admin who made the change
    - Previous role
    - New role

**Expected Result**: Complete history of role changes visible with metadata.

### Example 3: Last Admin Protection

1. **Attempt to Demote Only Admin**
  - Login as the only admin in the system
  - Try to change another admin's role to "User"

2. **Validation Error**
  - System prevents the change
  - Error message: "Cannot demote the last administrator"
  - Role selector returns to original value

**Expected Result**: System prevents accidental removal of all admins.

## Next Steps

1. Read [data-model.md](./data-model.md) for entity details
2. Review [contracts/](./contracts/) for service interfaces
3. Check [plan.md](./plan.md) for implementation strategy
4. Run `/speckit.tasks` to generate implementation tasks

## Resources

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Angular Material Component Harnesses](https://material.angular.io/guide/using-component-harnesses)
- [GCP Datastore Documentation](https://cloud.google.com/datastore/docs)
- [Context7 Documentation](https://context7.com)

## Support

For questions or issues:

1. Check existing tests for examples
2. Review [research.md](./research.md) for design decisions
3. Consult project maintainers
