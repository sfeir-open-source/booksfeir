# Feature Specification: User Role Management

**Feature Branch**: `002-user-role-management`
**Created**: 2025-11-18
**Status**: Draft
**Input**: User description: "User manage - dans un besoin de gestion de droit d'utilisateur, je souhaite avoir la possibilité de saisir le role de chaque utilisateur sauf moi-meme en tant que admin, les different rôle seront user, librarian, et admin. le role librarian est attribuer à un utilisateur qui sera responsable d'une bibliothèque."

## Clarifications

### Session 2025-11-19

- Q: What is the relationship between librarians and libraries? → A: Each librarian can manage multiple libraries (one-to-many relationship)
- Q: What role is assigned to new users when they are created? → A: New users are assigned the "user" role by default
- Q: How does the system handle concurrent role assignments to the same user by different admins? → A: Last save wins (optimistic locking)
- Q: How long should audit log entries for role changes be retained? → A: Automatic deletion after 1 month
- Q: How should role assignment validation errors be presented to admins? → A: Display inline error message with specific reason

### Session 2025-11-20

- Q: What attributes should the Library entity have? → A: Basic: Library has id, name, and location (string address)
- Q: What specific features should librarians have access to? → A: Librarians can manage book inventory (add/edit/remove books) and view borrowing records for their assigned libraries
- Q: How should the librarian-to-library relationship be stored in the data model? → A: Separate LibraryAssignment join table with userId and libraryId
- Q: What specific operation does SC-001 "under 30 seconds" measure? → A: Time from clicking a user in the list until role change confirmation appears (complete round-trip)
- Q: What happens to library assignments when a librarian's role is changed to user or admin? → A: Keep library assignments intact (they're ignored unless user is a librarian)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Assigns User Role (Priority: P1)

As an administrator, I want to assign basic "user" roles to new members so they can access the library system with standard permissions.

**Why this priority**: This is the foundation of the role management system. Without the ability to assign basic user roles, the system cannot function. This represents the minimal viable functionality - allowing access control for the most common user type.

**Independent Test**: Can be fully tested by logging in as an admin, navigating to user management, selecting a user (not the current admin), and assigning them the "user" role. Delivers immediate value by enabling basic access control.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I view the list of users, **Then** I see all users except myself with an editable role field
2. **Given** I am logged in as an admin and viewing a user's profile, **When** I select "user" from the role dropdown and save, **Then** the user's role is updated to "user"
3. **Given** I am viewing my own admin profile, **When** I look for role editing options, **Then** I cannot see or access the role field for my own account
4. **Given** I am logged in as an admin, **When** I assign a role to a user, **Then** the system confirms the role assignment with a success message

---

### User Story 2 - Admin Assigns Librarian Role (Priority: P2)

As an administrator, I want to assign "librarian" roles to users who will be responsible for managing a specific library, giving them elevated permissions for library operations.

**Why this priority**: This adds the specialized role for library management, which is critical for operational delegation but requires the base user role functionality to already exist.

**Independent Test**: Can be tested independently by assigning a librarian role to a user and verifying they receive library management permissions. Delivers value by enabling distributed library management.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin and viewing a user's profile, **When** I select "librarian" from the role dropdown and save, **Then** the user's role is updated to "librarian"
2. **Given** I have assigned a librarian role to a user, **When** that user logs in, **Then** they can manage book inventory (add/edit/remove books) and view borrowing records for their assigned libraries
3. **Given** I am logged in as an admin, **When** I view the list of users, **Then** I can see which users have the "librarian" role assigned

---

### User Story 3 - Admin Assigns Admin Role (Priority: P3)

As an administrator, I want to promote other users to admin status so they can also manage user roles and perform administrative tasks.

**Why this priority**: This enables administrative delegation and is important for system scalability, but is not essential for initial operations. It builds on top of the user and librarian role functionality.

**Independent Test**: Can be tested by assigning an admin role to another user and verifying they can perform administrative functions. Delivers value by enabling administrative team growth.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin and viewing a user's profile, **When** I select "admin" from the role dropdown and save, **Then** the user's role is updated to "admin"
2. **Given** I have assigned an admin role to a user, **When** that user logs in, **Then** they can manage other users' roles (except their own)
3. **Given** a user has been promoted to admin, **When** they view their own profile, **Then** they cannot modify their own role

---

### User Story 4 - Role Change Audit Trail (Priority: P3)

As an administrator, I want to see a history of role changes so I can track who made what changes and when, ensuring accountability.

**Why this priority**: This is important for security and compliance but is not required for basic functionality. It enhances the system after core role assignment is working.

**Independent Test**: Can be tested by making several role changes and viewing the audit log. Delivers value by providing transparency and accountability.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I view a user's profile, **Then** I can see a history of their role changes including timestamp and who made the change
2. **Given** I have changed a user's role, **When** I view the audit log, **Then** my action is recorded with the date, time, previous role, and new role

---

### Edge Cases

- What happens when the last remaining admin tries to view their own role field? (System should prevent this from being visible/editable)
- How does the system handle concurrent role assignments to the same user by different admins? (Last save wins using optimistic locking; audit trail will record both changes)
- What happens if an admin is demoted to a lower role while they are logged in? (They continue with admin permissions until they log out and log back in)
- What happens when a librarian's role is changed to "user"? (They continue with librarian permissions until they log out and log back in; library assignments remain in the database but are ignored while the user is not a librarian)
- How does the system handle role assignment for users who have never logged in? (Should allow role assignment to prepare accounts before first login)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of all users except the currently logged-in admin when in the user management interface
- **FR-002**: System MUST provide three distinct roles: "user" (basic access), "librarian" (can manage book inventory and view borrowing records for assigned libraries), and "admin" (full system administration)
- **FR-003**: System MUST allow admins to select and assign any of the three roles (user, librarian, admin) to other users
- **FR-004**: System MUST prevent any admin from modifying their own role assignment
- **FR-005**: System MUST persist role assignments immediately upon saving
- **FR-006**: System MUST provide visual feedback when role assignments are modified, displaying inline error messages with specific reasons for failures (e.g., "Cannot assign role: user not found") and success confirmations
- **FR-007**: System MUST enforce role-based permissions, ensuring users only have access to features appropriate for their assigned role; library assignments are ignored for users who are not currently librarians
- **FR-013**: System MUST preserve library assignments in the LibraryAssignment table when a librarian's role is changed to user or admin, allowing assignments to be automatically restored if the user is reassigned to librarian role
- **FR-008**: System MUST display the current role for each user in the user management interface
- **FR-009**: System MUST validate that only users with admin role can access the role management functionality
- **FR-010**: System MUST apply role changes to users on their next login, meaning changes persist in storage immediately but active sessions continue with their existing permissions until the user logs out and logs back in
- **FR-011**: System MUST automatically assign the "user" role to all newly created users by default
- **FR-012**: System MUST retain audit log entries for role changes for 1 month, then automatically delete entries older than 1 month
- **FR-014**: System MUST maintain active admin session permissions until logout, meaning if an admin is demoted while logged in, they retain admin capabilities until they explicitly log out and log back in

### Key Entities

- **User**: Represents a person who has access to the system; includes identity information (name, email, etc.) and an assigned role
- **Role**: Represents a permission level (user, librarian, or admin); determines what features and actions a user can access
- **Role Assignment**: Links a user to a role; includes metadata about who made the assignment and when (for audit purposes)
- **Library**: Represents a physical or logical library location with id (unique identifier), name (library name), and location (string address)
- **Library Assignment**: Join table linking librarians to libraries; contains userId and libraryId to support one-to-many relationship (one librarian can manage multiple libraries)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can assign or change a user's role in under 30 seconds (measured from clicking a user in the list until role change confirmation message appears)
- **SC-002**: 100% of role assignments are successfully persisted and immediately reflected in the user interface
- **SC-003**: Zero instances where an admin can modify their own role
- **SC-004**: All users experience appropriate feature access based on their assigned role immediately upon logging in after a role change
- **SC-005**: 95% of role assignment operations complete without errors
- **SC-006**: Admin users can correctly identify and assign roles to at least 20 users in under 5 minutes
