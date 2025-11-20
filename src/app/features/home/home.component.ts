import {ChangeDetectionStrategy, Component, computed, inject, linkedSignal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {catchError, of, startWith, Subject, switchMap} from 'rxjs';
import {LibraryService} from '../../core/services/library.service';
import {Library} from '../../core/models/library.model';
import {AuthMockService} from '../../core/services/mock/auth-mock.service';

/**
 * HomeComponent
 *
 * Displays the homepage with a grid of all available libraries.
 * Users can click on a library card to navigate to the library detail view.
 *
 * Features:
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Material Design cards for each library
 * - Loading indicator while fetching data
 * - Empty state message when no libraries exist
 * - OnPush change detection with signals
 */
@Component({
  selector: 'sfeir-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private libraryService = inject(LibraryService);
  private authService = inject(AuthMockService);

  // Signal for libraries list
  libraries = linkedSignal(this.libraryService.libraries);

  // User authentication state
  rigthOfManage = computed(() => this.authService.rigthOfManage());

  // Subject to trigger library loading
  private loadLibrariesTrigger$ = new Subject<void>();

  // Observable stream for loading libraries
  private librariesLoad$ = this.loadLibrariesTrigger$.pipe(
    startWith(undefined), // Trigger initial load
    switchMap(() =>
      this.libraryService.getAll().pipe(
        catchError(error => {
          console.error('Failed to load libraries:', error);
          return of(undefined);
        })
      )
    )
  );

  // Convert to signal for automatic subscription management
  private librariesLoadStatus = toSignal(this.librariesLoad$);

  // Loading state derived from libraries load status
  isLoading = computed(() => this.librariesLoadStatus() === undefined && this.libraries().length === 0);

  /**
   * Track by function for @for loop optimization
   */
  trackByLibraryId(index: number, library: Library): string {
    return library.id;
  }
}
