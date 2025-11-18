import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

/**
 * Application Configuration
 *
 * Providers:
 * - Zoneless change detection (no zone.js)
 * - Angular Router with lazy-loaded routes
 * - HttpClient with fetch API
 * - Angular Material animations
 * - Mock services (DatastoreMockService, AuthMockService) via providedIn: 'root'
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimations()
  ]
};
