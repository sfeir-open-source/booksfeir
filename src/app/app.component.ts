import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './features/shared/navigation/navigation.component';

/**
 * Root Application Component
 *
 * Structure:
 * - NavigationComponent (top nav bar)
 * - RouterOutlet (lazy-loaded feature components)
 *
 * Features:
 * - Zoneless change detection with OnPush strategy
 * - Standalone component architecture
 * - Material Design UI
 */
@Component({
  selector: 'sfeir-app',
  standalone: true,
  imports: [
    RouterOutlet,
    NavigationComponent
  ],
  template: `
    <sfeir-navigation />
    <main class="app-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .app-content {
      flex: 1;
      overflow-y: auto;
      background-color: #fafafa;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
