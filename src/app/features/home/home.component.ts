import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LibraryService } from '../../core/services/library.service';
import { Library } from '../../core/models/library.model';

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
export class HomeComponent implements OnInit {
  private libraryService = inject(LibraryService);

  // Signal for libraries list
  libraries = this.libraryService.libraries;

  // Loading state
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadLibraries();
  }

  private loadLibraries(): void {
    this.isLoading.set(true);
    this.libraryService.getAll().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Track by function for @for loop optimization
   */
  trackByLibraryId(index: number, library: Library): string {
    return library.id;
  }
}
