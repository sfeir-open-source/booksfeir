import {Routes} from '@angular/router';
import {manageContentGuard} from './core/guards/manageContentGuard';

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
    loadComponent: () => import('./features/library-form/library-form.component').then(m => m.LibraryFormComponent),
    canActivate: [manageContentGuard]
  },
  {
    path: 'library/:id/edit',
    loadComponent: () => import('./features/library-form/library-form.component').then(m => m.LibraryFormComponent),
    canActivate: [manageContentGuard]
  },
  {
    path: 'library/:libraryId/book/new',
    loadComponent: () => import('./features/book-form/book-form.component').then(m => m.BookFormComponent),
    canActivate: [manageContentGuard]
  },
  {
    path: 'library/:libraryId/book/:id/edit',
    loadComponent: () => import('./features/book-form/book-form.component').then(m => m.BookFormComponent),
    canActivate: [manageContentGuard]
  },
  {
    path: 'library/:id',
    loadComponent: () => import('./features/library-detail/library-detail.component').then(m => m.LibraryDetailComponent)
  },
  {
    path: 'user-management',
    loadChildren: () => import('./features/user-management/user-management.routes').then(m => m.userManagementRoutes)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
