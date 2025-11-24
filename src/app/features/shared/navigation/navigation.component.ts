import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AuthMockService} from '../../../core/services/mock/auth-mock.service';
import {MatListItemAvatar} from '@angular/material/list';

/**
 * NavigationComponent
 *
 * Top navigation bar displaying:
 * - Application logo (left)
 * - Application name (left)
 * - User avatar and name (right)
 *
 * Features:
 * - Material Design toolbar
 * - Reactive user info from AuthMockService
 * - Responsive layout
 */
@Component({
  selector: 'sfeir-navigation',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListItemAvatar
  ],
  template: `
    <mat-toolbar color="primary" class="navigation-toolbar">
      <div class="toolbar-content">
        <!-- Logo and App Name -->
        <div class="logo-section">
          <a routerLink="/" class="logo-link">
            <img
              src="/favicon.png"
              alt="Booksfeir Logo"
              class="logo-image"
              width="32"
              height="32"
            />
            <span class="app-name">Booksfeir</span>
          </a>
        </div>

        <!-- Navigation Menu -->
        <nav class="nav-menu">
          <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <mat-icon>home</mat-icon>
            <span>Libraries</span>
          </a>
          <a mat-button routerLink="/search" routerLinkActive="active">
            <mat-icon>search</mat-icon>
            <span>Search Books</span>
          </a>
          <a mat-button routerLink="/borrowed" routerLinkActive="active">
            <mat-icon>book</mat-icon>
            <span>My Books</span>
          </a>
        </nav>

        <!-- User Info -->
        <div class="user-section">
          @if (currentUser(); as user) {
            <div class="user-info">
              @if (user.avatar) {
                <img matListItemAvatar [src]="user.avatar" [alt]="user.name + ' avatar'">
              } @else {
                <div matListItemAvatar class="avatar-placeholder">
                  {{ getInitials(user.name) }}
                </div>
              }
              <span class="user-name">{{ user.name }}</span>
            </div>
          }
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navigation-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .toolbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }

    .logo-section {
      display: flex;
      align-items: center;
    }

    .logo-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
      transition: opacity 0.2s;
    }

    .logo-link:hover {
      opacity: 0.8;
    }

    .logo-image {
      border-radius: 4px;
    }

    .app-name {
      font-size: 20px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .nav-menu {
      display: flex;
      gap: 12px;
      flex: 1;
      justify-content: center;

      a {
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        background: linear-gradient(135deg, rgba(0, 115, 230, 0.5), rgba(0, 191, 166, 0.5));

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &.active {
          background: linear-gradient(135deg, rgba(0, 115, 230, 0.9), rgba(0, 191, 166, 0.9));
        }

        &:hover {
          background: linear-gradient(135deg, rgb(0, 115, 230), rgb(0, 191, 166));
        }
      }
    }

    .user-section {
      display: flex;
      align-items: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    // Avatar placeholder styling
    .avatar-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #1976d2;
      color: white;
      font-weight: 500;
      font-size: 16px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-avatar-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .nav-menu a span {
        display: none;
      }
    }

    @media (max-width: 600px) {
      .app-name {
        display: none;
      }

      .user-name {
        display: none;
      }

      .nav-menu {
        gap: 4px;
      }
    }
  `]
})
export class NavigationComponent {
  private authService = inject(AuthMockService);

  // Reactive current user from auth service
  currentUser = this.authService.currentUser;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
