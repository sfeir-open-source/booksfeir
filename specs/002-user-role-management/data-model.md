# Data Model: User Role Management

**Feature**: 002-user-role-management
**Date**: 2025-11-19
**Status**: Complete

## Overview

This document defines the data entities, relationships, and validation rules for the user role management feature. All entities are stored in GCP Datastore with equivalent in-memory representations for mock service.

## Entities

### User

Represents a person with access to the system.

**TypeScript Interface**:

```typescript
export interface User {
  id: string;                    // Unique identifier (Datastore key)
  email: string;                 // User email address (unique)
  name: string;                  // Display name
  role: Role;                    // Current assigned role
  createdAt: Date;               // Account creation timestamp
  updatedAt: Date;               // Last modification timestamp
  updatedBy: string;             // User ID of last modifier
}
```

**Validation Rules**:

- `id`: Required, non-empty string
- `email`: Required, valid email format, unique across all users
- `name`: Required, non-empty string, 1-100 characters
- `role`: Required, must be one of `Role` enum values
- `createdAt`: Required, valid Date
- `updatedAt`: Required, valid Date, >= createdAt
- `updatedBy`: Required, non-empty string, must reference existing User.id

**Invariants**:

- User cannot modify their own role (enforced in service layer)
- Default role is 'user' for newly created accounts
- Library assignments stored separately in LibraryAssignment join table

**Datastore Kind**: `User`
**Indexes**: `email` (unique), `role`

---

### Role

Enum representing permission levels.

**TypeScript Type**:

```typescript
export enum Role {
  USER = 'user',           // Basic access
  LIBRARIAN = 'librarian', // Library management
  ADMIN = 'admin'          // Full system administration
}
```

**Values**:

- `user`: Basic library access (borrow books, view catalogs)
- `librarian`: Manage assigned libraries (add/remove books, manage inventory)
- `admin`: Full system access (user management, role assignment, all librarian permissions)

**Validation**:

- Must be one of the three enum values
- Case-sensitive string comparison

---

### RoleAssignment

Links a user to a role with audit metadata.

**TypeScript Interface**:

```typescript
export interface RoleAssignment {
  userId: string;         // Reference to User.id
  role: Role;             // Assigned role
  assignedAt: Date;       // When role was assigned
  assignedBy: string;     // User ID of admin who assigned the role
  previousRole?: Role;    // Previous role (for audit trail)
}
```

**Validation Rules**:

- `userId`: Required, must reference existing User.id
- `role`: Required, valid Role enum value
- `assignedAt`: Required, valid Date
- `assignedBy`: Required, must reference existing User.id with role === 'admin'
- `previousRole`: Optional, valid Role enum value if present

**Relationships**:

- `userId` → User (many-to-one)
- `assignedBy` → User (many-to-one)

**Datastore Kind**: `RoleAssignment`
**Indexes**: `userId`, `assignedAt` (descending)

---

### AuditEntry

Records role change events for accountability.

**TypeScript Interface**:

```typescript
export interface AuditEntry {
  id: string;              // Unique identifier
  userId: string;          // User whose role changed
  action: 'role_change';   // Action type (extensible for future audit events)
  oldRole: Role;           // Role before change
  newRole: Role;           // Role after change
  changedBy: string;       // Admin who made the change
  timestamp: Date;         // When the change occurred
}
```

**Validation Rules**:

- `id`: Required, non-empty string
- `userId`: Required, must reference existing User.id
- `action`: Required, currently only 'role_change'
- `oldRole`: Required, valid Role enum value
- `newRole`: Required, valid Role enum value, must differ from oldRole
- `changedBy`: Required, must reference existing User.id with role === 'admin'
- `timestamp`: Required, valid Date

**Lifecycle**:

- Created on every role change
- Immutable after creation
- Automatically deleted after 1 month (retention policy)

**Datastore Kind**: `AuditEntry`
**Indexes**: `userId`, `timestamp` (descending for recent-first queries)
**TTL**: 30 days (automatic cleanup)

---

### Library

Represents a physical or logical library location.

**TypeScript Interface**:

```typescript
export interface Library {
  id: string;              // Unique identifier
  name: string;            // Library name
  location: string;        // Physical address (string)
  createdAt: Date;         // Creation timestamp
}
```

**Validation Rules**:

- `id`: Required, non-empty string
- `name`: Required, non-empty string
- `location`: Required, non-empty string (address)
- `createdAt`: Required, valid Date

**Note**: This entity exists in the broader application context. The user role management feature only references library IDs for librarian assignments via LibraryAssignment join table.

**Datastore Kind**: `Library`

---

### LibraryAssignment

Join table linking librarians to their assigned libraries.

**TypeScript Interface**:

```typescript
export interface LibraryAssignment {
  id: string;              // Unique identifier
  userId: string;          // Reference to User.id (must have role === 'librarian')
  libraryId: string;       // Reference to Library.id
  assignedAt: Date;        // When assignment was created
  assignedBy: string;      // Admin who created the assignment
}
```

**Validation Rules**:

- `id`: Required, non-empty string
- `userId`: Required, must reference existing User.id with role === 'librarian'
- `libraryId`: Required, must reference existing Library.id
- `assignedAt`: Required, valid Date
- `assignedBy`: Required, must reference existing User.id with role === 'admin'

**Relationships**:

- `userId` → User (many-to-one)
- `libraryId` → Library (many-to-one)
- `assignedBy` → User (many-to-one)

**Lifecycle**:

- Created when admin assigns libraries to a librarian
- Preserved when user's role changes from librarian (assignments ignored for non-librarian roles)
- Deleted manually by admin or when user is deleted

**Datastore Kind**: `LibraryAssignment`
**Indexes**: `userId`, `libraryId`

---

## Relationships

### User ↔ Library (Many-to-Many via LibraryAssignment)

- A User with role 'librarian' can manage multiple Libraries
- A Library can be managed by multiple Users (librarians)
- Relationship stored in `LibraryAssignment` join table
- Assignments are preserved when user role changes (but ignored for non-librarians)
- Query pattern: `query<LibraryAssignment>('LibraryAssignment', [{ field: 'userId', op: '==', value: userId }])`

### User ↔ RoleAssignment (One-to-Many)

- Each User has multiple RoleAssignment records (historical)
- Current role stored denormalized in `User.role` for fast lookups
- RoleAssignment provides audit trail of all role changes

### User ↔ AuditEntry (One-to-Many)

- Each User has multiple AuditEntry records
- AuditEntry records all role changes for the user
- Automatically cleaned up after 1 month

---

## State Transitions

### User Role Lifecycle

```
[New Account Created]
         ↓
    role = 'user' (default)
         ↓
    [Admin assigns role]
         ↓
    ┌─────────────────┐
    │  user           │ ←→ (Admin can change)
    │  librarian      │ ←→ (Admin can change)
    │  admin          │ ←→ (Admin can change)
    └─────────────────┘
         ↓
    [All transitions logged in AuditEntry]
```

**Allowed Transitions**:

- user → librarian: Allowed
- user → admin: Allowed
- librarian → user: Allowed (LibraryAssignment records preserved but ignored)
- librarian → admin: Allowed
- admin → user: Allowed (if not last admin)
- admin → librarian: Allowed (if not last admin)

**Forbidden Transitions**:

- Self-modification: User cannot change their own role
- Last admin demotion: Cannot demote last remaining admin

---

## Validation Summary

| Entity            | Required Fields                                            | Unique Fields | Foreign Keys                                                   | Constraints                 |
|-------------------|------------------------------------------------------------|---------------|----------------------------------------------------------------|-----------------------------|
| User              | id, email, name, role, createdAt, updatedAt, updatedBy     | email         | updatedBy → User.id                                            | role ∈ Role enum            |
| RoleAssignment    | userId, role, assignedAt, assignedBy                       | -             | userId → User.id, assignedBy → User.id                         | assignedBy.role === 'admin' |
| AuditEntry        | id, userId, action, oldRole, newRole, changedBy, timestamp | -             | userId → User.id, changedBy → User.id                          | oldRole ≠ newRole           |
| Library           | id, name, location, createdAt                              | -             | -                                                              | -                           |
| LibraryAssignment | id, userId, libraryId, assignedAt, assignedBy              | -             | userId → User.id, libraryId → Library.id, assignedBy → User.id | userId.role === 'librarian' |

---

## Mock Data for Development

Sample data for local development and testing:

```typescript
const mockUsers: User[] = [
  {
    id: 'admin1',
    email: 'admin@booksfeir.com',
    name: 'Admin User',
    role: Role.ADMIN,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    updatedBy: 'system'
  },
  {
    id: 'lib1',
    email: 'librarian1@booksfeir.com',
    name: 'Jane Librarian',
    role: Role.LIBRARIAN,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    updatedBy: 'admin1',
    libraryIds: ['library1', 'library2']
  },
  {
    id: 'user1',
    email: 'user@example.com',
    name: 'Regular User',
    role: Role.USER,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    updatedBy: 'admin1'
  }
];
```

---

## Database Indexes

### Datastore Composite Indexes

```yaml
# index.yaml (for GCP Datastore)
indexes:
  - kind: AuditEntry
    properties:
      - name: userId
      - name: timestamp
        direction: desc

  - kind: RoleAssignment
    properties:
      - name: userId
      - name: assignedAt
        direction: desc
```

**Rationale**:

- `AuditEntry` (userId + timestamp desc): Support "get recent audit logs for user" query
- `RoleAssignment` (userId + assignedAt desc): Support "get role history for user" query

---

## Data Access Patterns

### Primary Queries

1. **Get all users except current admin**:
   ```typescript
   query<User>('User', [{ field: 'id', op: '!=', value: currentUserId }])
   ```

2. **Get user by email**:
   ```typescript
   query<User>('User', [{ field: 'email', op: '=', value: email }])
   ```

3. **Get audit trail for user**:
   ```typescript
   query<AuditEntry>('AuditEntry', [
     { field: 'userId', op: '=', value: userId },
     { orderBy: 'timestamp', direction: 'desc' }
   ])
   ```

4. **Get users by role**:
   ```typescript
   query<User>('User', [{ field: 'role', op: '=', value: Role.LIBRARIAN }])
   ```

5. **Cleanup old audit entries**:
   ```typescript
   query<AuditEntry>('AuditEntry', [
     { field: 'timestamp', op: '<', value: oneMonthAgo }
   ])
   ```

---

## Schema Evolution

Future extensibility considerations:

1. **Additional roles**: Enum can be extended (e.g., 'moderator')
2. **Granular permissions**: Role could reference Permission[] array
3. **Multi-library assignments**: `libraryIds` already supports this
4. **Audit event types**: `action` field can accommodate new event types
5. **Role expiration**: Add `expiresAt?: Date` to RoleAssignment

No breaking changes required for these extensions.
