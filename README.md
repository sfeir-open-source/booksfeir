# 📚 Booksfeir

A modern library management system built with Angular 20, featuring book borrowing, search integration with Google Books API, and a clean Material Design interface.

## ✨ Features

### Core Functionality
- **Library Management**: Create, view, edit, and delete libraries
- **Book Management**: Add, edit, and remove books from libraries with detailed metadata
- **Book Borrowing System**:
  - Borrow up to 3 books simultaneously
  - 14-day borrowing period with due date tracking
  - Overdue warnings and status indicators
  - Easy return process
- **Google Books Search**: Search and request books from Google Books API
- **Purchase Requests**: Submit requests for books not yet in the system

### User Experience
- 🎨 Modern Material Design UI with responsive layout
- 🚀 Fast navigation with lazy-loaded routes
- 📱 Mobile-friendly interface
- ⚡ Real-time updates with Angular Signals
- 🔍 Intuitive search and filtering

## 🛠️ Tech Stack

### Frontend Framework
- **Angular 20** - Latest version with standalone components
- **TypeScript** - Strict mode enabled
- **RxJS** - Reactive programming

### UI & Styling
- **Angular Material 20** - Material Design components
- **SCSS** - Component-scoped styling
- **Responsive Design** - Mobile-first approach

### State Management
- **Angular Signals** - Reactive state management
- **OnPush Change Detection** - Performance optimization

### Architecture
- **Standalone Components** - No NgModules
- **Lazy Loading** - Route-based code splitting
- **Service-based Architecture** - Separation of concerns
- **Mock Data Store** - localStorage-based persistence

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 20+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd booksfeir

# Install dependencies
npm install

# Start development server
npm start
# or
ng serve --port 4201
```

The application will be available at `http://localhost:4201`

### Build for Production

```bash
npm run build
# or
ng build
```

Build artifacts will be stored in the `dist/` directory.

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                          # Core services and models
│   │   ├── models/                    # Data models and interfaces
│   │   │   ├── book.model.ts
│   │   │   ├── library.model.ts
│   │   │   ├── borrow-transaction.model.ts
│   │   │   ├── purchase-request.model.ts
│   │   │   └── user.model.ts
│   │   └── services/                  # Business logic services
│   │       ├── book.service.ts
│   │       ├── library.service.ts
│   │       ├── borrow.service.ts
│   │       ├── purchase-request.service.ts
│   │       ├── google-books.service.ts
│   │       └── mock/                  # Mock services
│   │           ├── datastore-mock.service.ts
│   │           └── auth-mock.service.ts
│   ├── features/                      # Feature modules
│   │   ├── home/                      # Library listing
│   │   ├── library-detail/            # Library details with books
│   │   ├── library-form/              # Create/Edit library
│   │   ├── book-form/                 # Create/Edit book
│   │   ├── book-search/               # Google Books search
│   │   ├── borrowed-books/            # User's borrowed books
│   │   └── shared/                    # Shared components
│   │       ├── navigation/            # Top navigation bar
│   │       └── dialogs/               # Reusable dialogs
│   ├── app.component.ts               # Root component
│   ├── app.config.ts                  # App configuration
│   └── app.routes.ts                  # Routing configuration
└── styles.scss                        # Global styles
```

## 🎯 User Flows

### Viewing Libraries
1. Homepage displays all libraries in a grid layout
2. Click on a library card to view details
3. See all books in the library with their availability status

### Managing Libraries
1. Click "Add Library" on homepage
2. Fill in library details (name, description, location)
3. Submit to create a new library
4. Edit or delete from library detail page

### Managing Books
1. Navigate to a library detail page
2. Click "Add Book" to create a new book
3. Fill in book metadata (title, author, ISBN, etc.)
4. Edit or delete books from the library view

### Borrowing Books
1. Browse available books in any library
2. Click "Borrow" on an available book
3. Book status updates to "Borrowed"
4. View borrowed books in "My Books" section
5. Return books when finished

### Searching for Books
1. Navigate to "Search Books" in the top menu
2. Select target library for the book
3. Enter search query (title, author, ISBN)
4. Browse results from Google Books API
5. Submit purchase request for desired books

### Viewing Borrowed Books
1. Click "My Books" in navigation
2. View all currently borrowed books
3. See due dates and overdue warnings
4. Return books directly from this view

## 🔧 Business Rules

### Borrowing Rules
- Users can borrow up to **3 books simultaneously**
- Borrowing period: **14 days**
- Books must be returned to their original library
- Only available books can be borrowed
- One book cannot be borrowed by multiple users

### Library Management
- Libraries with borrowed books cannot be deleted
- Each library has a unique name and optional location

### Book Management
- Books require title and author (minimum)
- Books currently borrowed cannot be deleted
- Multiple copies of the same book are allowed

## 🎨 Design Principles

### Code Quality
- **TypeScript Strict Mode**: Full type safety
- **OnPush Change Detection**: Optimized performance
- **Signal-based State**: Reactive and efficient
- **Standalone Components**: Modern Angular architecture
- **Lazy Loading**: Better initial load times

### Best Practices
- Separation of concerns with services
- Reusable component architecture
- Proper error handling and user feedback
- Loading states for async operations
- Confirmation dialogs for destructive actions

## 🧪 Development

This project was developed using:
- **[Angular CLI](https://github.com/angular/angular-cli)** version 20.3.5
- **[Spec Kit](https://github.com/github/spec-kit)** version 0.0.79 for feature development
- **Claude Code** AI assistant with **Context7 MCP** for documentation

### Key Technologies
- **Zoneless Change Detection**: `provideExperimentalZonelessChangeDetection()`
- **HttpClient with Fetch**: Modern HTTP client
- **RxJS Operators**: Advanced reactive patterns
- **localStorage**: Mock data persistence

## 📝 API Integration

### Google Books API
The application integrates with Google Books API to search for books:
- Search by title, author, or ISBN
- Display book covers and metadata
- Extract ISBN-10/ISBN-13 from API results
- Handle API errors gracefully

## 🎯 Future Enhancements

Potential improvements for future versions:
- User authentication and authorization
- Advanced search filters and sorting
- Book ratings and reviews
- Reading lists and favorites
- Email notifications for due dates
- Library analytics dashboard
- Admin panel for purchase request management
- Multi-language support
- Book reservation system

## 📄 License

[Apache Licence](./LICENSE)

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Contact

[Add contact information here]

---

Built with ❤️ using Angular 20 and Material Design
