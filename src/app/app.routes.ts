import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'search',
    loadComponent: () => import('./features/book-search/book-search.component').then(m => m.BookSearchComponent)
  },
  {
    path: 'borrowed',
    loadComponent: () => import('./features/borrowed-books/borrowed-books').then(m => m.BorrowedBooksComponent)
  },
  {
    path: 'library/new',
    loadComponent: () => import('./features/library-form/library-form.component').then(m => m.LibraryFormComponent)
  },
  {
    path: 'library/:id/edit',
    loadComponent: () => import('./features/library-form/library-form.component').then(m => m.LibraryFormComponent)
  },
  {
    path: 'library/:libraryId/book/new',
    loadComponent: () => import('./features/book-form/book-form.component').then(m => m.BookFormComponent)
  },
  {
    path: 'library/:libraryId/book/:id/edit',
    loadComponent: () => import('./features/book-form/book-form.component').then(m => m.BookFormComponent)
  },
  {
    path: 'library/:id',
    loadComponent: () => import('./features/library-detail/library-detail.component').then(m => m.LibraryDetailComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
