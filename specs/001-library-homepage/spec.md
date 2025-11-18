# Feature Specification: Library Management Homepage

**Feature Branch**: `001-library-homepage`
**Created**: 2025-11-12
**Status**: Draft
**Input**: User description: "booksfeir homepage - cette page doit mettre en avant differente biblothèque que l'on pouras ajouté, modifier, supprimer ulterieurement. une bibliothèque pouras contenir différent livres qui seront empruntable et réstituer dans la biblithèque d'origine. un livre est contituer d'un titre, auteur, edition, date de publication, isbn, image de converture. Dans une bibliothèque, un livre peut etre ajouté, supprimé ou modifier ultérieurment. L'ors de la recherche d'un livre dans une bibliothque est qu'il n'y a aucun résultat on fait une recherche sur l'api google book et on propose une liste de 5 livres maximum en résultat suivant leur date de publication la plus récente. Je souahite en haut de la page une bar de navigation qui regoupera le logo @public/favicon.png ainsi que le nom de l'application, et a droite de celle-ci les information et préférence utilisateur avec son nom et avatar."

## Clarifications

### Session 2025-11-12

- Q: What information should a library contain beyond its name? → A: Library has name, description, and location fields
- Q: Which book fields are required vs optional when adding a book? → A: Title and author required; all others optional
- Q: What happens when a user tries to delete a library that contains borrowed books? → A: Prevent deletion with error message; require all books returned first
- Q: How should the system handle Google Books API being unavailable or returning errors? → A: Silently fail; show only local results with no indication
- Q: What can users do with Google Books API search results? → A: Results show with "Request Purchase" button for library admin

### Session 2025-11-13

- Q: How should SC-010 (95% task completion rate) be measured and validated? → A: User Acceptance Testing with 20+ users performing predefined task scenarios, tracking completion rate, error rate, and help requests
- Q: How should the system handle books with missing optional information? → A: Display with placeholders ("Unknown" for ISBN, default icon for images, "Not specified" for edition/date)
- Q: How should the system handle duplicate books in the same library? → A: Allow duplicates to represent multiple physical/digital copies with independent availability status
- Q: How should the system handle invalid or corrupted cover image uploads? → A: Client-side validation for file type (JPEG/PNG/WebP) and size (<5MB) with error message; graceful degradation with default icon if corrupted
- Q: Should the User entity description include the email field? → A: Yes, User contains name (required), email (required), and avatar (optional)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Navigate Library Collection (Priority: P1)

A user opens the Booksfeir application and sees a homepage displaying all available libraries. They can browse through the libraries, see basic information about each library, and navigate to view the books within each library. The top navigation bar shows the application logo, name, and user profile information.

**Why this priority**: This is the foundation of the application - users need to see and access libraries before performing any other actions. This creates the basic interface and navigation structure.

**Independent Test**: Can be fully tested by loading the homepage and verifying that libraries are displayed, navigation bar is present, and clicking on a library shows its books. Delivers immediate value by allowing users to browse existing content.

**Acceptance Scenarios**:

1. **Given** a user opens the Booksfeir application, **When** the homepage loads, **Then** they see a navigation bar at the top with the application logo, application name, and user information (name and avatar) on the right
2. **Given** a user is on the homepage, **When** they view the main content area, **Then** they see a list/grid of all available libraries
3. **Given** multiple libraries exist, **When** a user views the homepage, **Then** each library displays its name, description, and location
4. **Given** a user clicks on a library, **When** the library view opens, **Then** they see all books contained in that library

---

### User Story 2 - Manage Libraries (Priority: P2)

A user with appropriate permissions can create new libraries, edit existing library information, and delete libraries that are no longer needed. This allows the library collection to grow and evolve over time.

**Why this priority**: After users can view libraries (P1), they need the ability to manage the library collection itself. This enables the application to be populated with content and maintained over time.

**Independent Test**: Can be tested by creating a new library, verifying it appears in the homepage list, editing its information, and deleting it. Works independently of book management functionality.

**Acceptance Scenarios**:

1. **Given** a user is on the homepage, **When** they click "Add Library", **Then** they can enter library information and save it
2. **Given** a library exists, **When** a user selects "Edit Library", **Then** they can modify the library information and save changes
3. **Given** a library exists with no borrowed books, **When** a user selects "Delete Library", **Then** the library is removed from the homepage
4. **Given** a library contains books that are currently borrowed, **When** a user attempts to delete the library, **Then** the system prevents deletion and displays an error message instructing the user to ensure all books are returned first
5. **Given** a library is deleted, **When** the homepage refreshes, **Then** the deleted library no longer appears in the list

---

### User Story 3 - Manage Books in a Library (Priority: P3)

A user can add new books to a library, edit existing book information, and remove books from a library. Each book contains title, author, edition, publication date, ISBN, and cover image.

**Why this priority**: Once libraries can be created and viewed, users need to populate them with books. This is the core content management functionality but depends on libraries existing first.

**Independent Test**: Can be tested by opening a library, adding a new book with required information (title and author) plus optional fields, editing the book details, and removing it. Delivers value by allowing library content to be managed.

**Acceptance Scenarios**:

1. **Given** a user is viewing a library, **When** they click "Add Book", **Then** they can enter book details (title, author, edition, publication date, ISBN, cover image) and save
2. **Given** a book exists in a library, **When** a user selects "Edit Book", **Then** they can modify any book information and save changes
3. **Given** a book exists in a library, **When** a user selects "Delete Book", **Then** the book is removed from that library
4. **Given** a user adds a book, **When** they provide a cover image, **Then** the image is displayed with the book information

---

### User Story 4 - Search Books in a Library (Priority: P3)

A user can search for books within a specific library. If no results are found in the library, the system automatically searches the Google Books API and displays up to 5 of the most recently published matching books as suggestions.

**Why this priority**: Search functionality enhances the user experience but requires books and libraries to exist first. The Google Books API integration provides value when the local library doesn't have what users are looking for.

**Independent Test**: Can be tested by searching within a library for an existing book (verifying results), then searching for a non-existent book and verifying Google Books results appear (up to 5, sorted by most recent publication date).

**Acceptance Scenarios**:

1. **Given** a user is viewing a library, **When** they enter a search term, **Then** the system displays matching books from that library
2. **Given** a user searches within a library, **When** no local results are found, **Then** the system automatically queries Google Books API
3. **Given** Google Books API returns results, **When** the results are displayed, **Then** a maximum of 5 books are shown with a "Request Purchase" button on each
4. **Given** multiple Google Books results exist, **When** they are displayed, **Then** they are sorted by publication date with most recent first
5. **Given** Google Books results are displayed, **When** a user views them, **Then** each shows title, author, edition, publication date, ISBN, and cover image
6. **Given** a user views a Google Books result, **When** they click "Request Purchase", **Then** a purchase request is created for the library admin to review
7. **Given** a user searches within a library and no local results are found, **When** the Google Books API is unavailable or returns an error, **Then** the search completes showing only local results (empty in this case) without displaying any error message

---

### User Story 5 - Borrow and Return Books (Priority: P3)

A user can borrow books from a library and later return them to the original library. This tracks the availability and location of books within the system.

**Why this priority**: This adds the lending/borrowing workflow which is a key library management feature but requires all previous functionality to be in place first.

**Independent Test**: Can be tested by borrowing a book from a library, verifying it's marked as borrowed, then returning it to the original library and verifying availability status updates. Delivers value by enabling the core library lending workflow.

**Acceptance Scenarios**:

1. **Given** a book is available in a library, **When** a user borrows it, **Then** the book is marked as borrowed
2. **Given** a book is borrowed, **When** viewing the library, **Then** the book shows its borrowed status
3. **Given** a user has borrowed a book, **When** they return it, **Then** the book is returned to its original library
4. **Given** a book is returned, **When** viewing the library, **Then** the book is marked as available again

---

### Edge Cases

- System prevents deletion of libraries containing borrowed books and displays error message instructing user to ensure all books are returned first
- When Google Books API is unavailable or returns errors, system silently fails and shows only local search results without indication of external search failure
- Books with missing optional information (ISBN, cover image, edition, publication date) display with placeholders: "Unknown" for missing ISBN, default book cover icon for missing images, "Not specified" for missing edition/publication date. All functionality remains available regardless of missing optional fields.
- System allows duplicate books (same title and author) to be added to the same library, representing multiple physical or digital copies. Each copy is tracked as a separate entity with independent availability status, enabling concurrent borrowing of popular books.
- System validates cover image uploads client-side for file type (JPEG, PNG, WebP) and size (<5MB). Invalid uploads show error message: "Invalid image file. Please upload a JPEG, PNG, or WebP image under 5MB." If corrupted image passes validation but fails to render, system displays default book cover icon and logs error. Book saves successfully without image, ensuring workflow is not blocked.
- When searching with no internet connection, Google Books API is unavailable and system behaves per FR-018: silently continues with local search results only, without displaying error messages to users.
- System displays very long library names or book titles with text truncation and ellipsis in list/grid views, with full text visible on hover tooltip or in detail views. No character limits enforced on input fields.
- When Google Books API returns fewer than 5 results (including 0 results), system displays whatever results are returned. Maximum of 5 is an upper limit, not a requirement.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a homepage showing all available libraries
- **FR-002**: System MUST display a navigation bar at the top of all pages containing the application logo, application name, user name, and user avatar
- **FR-003**: System MUST allow users to create new libraries
- **FR-004**: System MUST allow users to edit existing library information
- **FR-005**: System MUST allow users to delete libraries
- **FR-006**: System MUST allow users to add books to a library with the following information: title (required), author (required), edition (optional), publication date (optional), ISBN (optional), and cover image (optional)
- **FR-007**: System MUST allow users to edit book information within a library
- **FR-008**: System MUST allow users to delete books from a library
- **FR-009**: System MUST provide search functionality within a library
- **FR-010**: System MUST integrate with Google Books API when local search returns no results
- **FR-011**: System MUST display a maximum of 5 Google Books API results
- **FR-012**: System MUST sort Google Books API results by publication date (most recent first)
- **FR-013**: System MUST allow users to borrow books from a library
- **FR-014**: System MUST allow users to return books to their original library
- **FR-015**: System MUST track the borrowed/available status of books
- **FR-016**: System MUST display cover images for books
- **FR-017**: System MUST prevent deletion of libraries that contain borrowed books and display an error message informing the user that all books must be returned before deletion
- **FR-018**: System MUST gracefully handle Google Books API failures by silently continuing with local search results only, without displaying error messages to users
- **FR-019**: System MUST display a "Request Purchase" button on each Google Books API search result
- **FR-020**: System MUST allow users to create purchase requests from Google Books results for library admin review

### Key Entities *(include if feature involves data)*

- **Library**: Represents a collection of books. Contains name (required), description (optional, explains purpose/collection focus), location (optional, e.g., physical or organizational location), and collection of books. Can be created, modified, and deleted by users.
- **Book**: Represents a physical or digital book. Contains title (required), author (required), edition (optional), publication date (optional), ISBN (optional), and cover image (optional). Belongs to a specific library and can be borrowed/returned. Can be added, modified, and removed from a library.
- **User**: Represents an application user. Contains name (required), email (required), and avatar (optional). Can view libraries, manage libraries (create/edit/delete), manage books within libraries, borrow books, and return books.
- **Borrow Transaction**: Represents the borrowing of a book. Links a user to a book and tracks the original library location to enable returns.
- **Purchase Request**: Represents a user's request to purchase a book found via Google Books API. Contains book information from Google Books (title, author, edition, publication date, ISBN, cover image), requesting user, target library, request date, and status (pending/approved/rejected). Requires library admin review and approval.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all libraries on the homepage within 2 seconds of loading the application
- **SC-002**: Users can create a new library in under 1 minute
- **SC-003**: Users can add a new book to a library with all required information in under 2 minutes
- **SC-004**: Search results (local or Google Books) appear within 3 seconds of submitting a search query
- **SC-005**: Google Books API fallback activates automatically when no local results are found, without requiring additional user action
- **SC-006**: Users can complete the borrow workflow (select book, confirm borrow) in under 30 seconds
- **SC-007**: Users can complete the return workflow (select book, confirm return) in under 30 seconds
- **SC-008**: The navigation bar displays correctly on all screen sizes and remains accessible throughout the application
- **SC-009**: Cover images load and display within 2 seconds for books that have images
- **SC-010**: 95% of users successfully complete their primary task (view libraries, manage books, or borrow/return) on the first attempt
  - **Measurement Method**: User Acceptance Testing with 20+ users performing predefined task scenarios. Track completion rate, error rate, and help requests. Success = user completes task without errors or requesting assistance. UAT conducted during testing phase with internal users or beta testers before launch.

## Assumptions

- Users have appropriate permissions to perform management operations (create, edit, delete libraries and books)
- Google Books API access is available and does not require authentication for basic search queries
- Cover images are provided as file uploads or URLs
- The application supports standard image formats for cover images (JPEG, PNG, WebP)
- User authentication and session management exists prior to this feature
- Users are pre-authenticated when accessing the homepage
- One book can only be borrowed by one user at a time
- Books must be returned to their original library (not transferred between libraries via borrow/return workflow)
- ISBN is stored as a string to accommodate different ISBN formats (ISBN-10, ISBN-13)
- Publication date is stored with year precision at minimum (full date preferred but not required)