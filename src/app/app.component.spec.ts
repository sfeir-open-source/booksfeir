import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AppComponent } from './app.component';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

// Test components for routing
@Component({
  standalone: true,
  template: '<div>Home Page</div>'
})
class TestHomeComponent {}

@Component({
  standalone: true,
  template: '<div>Library Detail Page</div>'
})
class TestLibraryDetailComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', component: TestHomeComponent },
          { path: 'library/:id', component: TestLibraryDetailComponent }
        ])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(AppComponent);
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  describe('App Structure', () => {
    it('should have navigation component', () => {
      fixture.detectChanges();

      const navigation = fixture.debugElement.query(By.css('sfeir-navigation'));
      expect(navigation).toBeTruthy();
    });

    it('should have router outlet', () => {
      fixture.detectChanges();

      const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
      expect(routerOutlet).toBeTruthy();
    });

    it('should have main content area', () => {
      fixture.detectChanges();

      const mainContent = fixture.debugElement.query(By.css('.app-content'));
      expect(mainContent).toBeTruthy();
    });

    it('should use flex layout for full viewport height', () => {
      fixture.detectChanges();

      const host = fixture.debugElement.nativeElement;
      const styles = window.getComputedStyle(host);

      // Host should have flex layout
      expect(host.style.display || styles.display).toContain('flex');
    });
  });

  describe('Navigation Integration', () => {
    it('should load NavigationComponent on app initialization', () => {
      fixture.detectChanges();

      const navigation = fixture.debugElement.query(By.css('sfeir-navigation'));
      expect(navigation).toBeTruthy();

      // Verify navigation has MatToolbar
      const toolbar = navigation.query(By.css('mat-toolbar'));
      expect(toolbar).toBeTruthy();
    });

    it('should display navigation before router content', () => {
      fixture.detectChanges();

      const appElement = fixture.debugElement.nativeElement;
      const navigation = appElement.querySelector('sfeir-navigation');
      const routerOutlet = appElement.querySelector('router-outlet');

      // Navigation should come before router-outlet in DOM
      expect(navigation).toBeTruthy();
      expect(routerOutlet).toBeTruthy();

      const navigationIndex = Array.from(appElement.children).indexOf(navigation);
      const routerOutletIndex = Array.from(appElement.querySelectorAll('*')).indexOf(routerOutlet);

      expect(navigationIndex).toBeLessThan(routerOutletIndex);
    });
  });

  describe('Routing Integration', () => {
    it('should navigate to home route by default', async () => {
      await router.navigate(['']);
      fixture.detectChanges();

      // Root path returns empty string in location.path()
      expect(location.path()).toBe('');
    });

    it('should render routed component in router outlet', async () => {
      await router.navigate(['']);
      fixture.detectChanges();

      const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
      expect(routerOutlet).toBeTruthy();

      // Content should be rendered after navigation
      const content = fixture.nativeElement.textContent;
      expect(content).toBeTruthy();
    });

    it('should navigate to library detail route', async () => {
      await router.navigate(['/library/123']);
      fixture.detectChanges();

      expect(location.path()).toBe('/library/123');
    });

    it('should maintain navigation across route changes', async () => {
      await router.navigate(['']);
      fixture.detectChanges();

      let navigation = fixture.debugElement.query(By.css('sfeir-navigation'));
      expect(navigation).toBeTruthy();

      await router.navigate(['/library/123']);
      fixture.detectChanges();

      navigation = fixture.debugElement.query(By.css('sfeir-navigation'));
      expect(navigation).toBeTruthy();
    });
  });

  describe('Change Detection Strategy', () => {
    it('should use OnPush change detection', () => {
      const component = fixture.componentInstance;
      const metadata = (component.constructor as any).__annotations__?.[0];

      // OnPush is value 0, Default is undefined/null
      expect(metadata?.changeDetection).toBe(0); // ChangeDetectionStrategy.OnPush = 0
    });
  });

  describe('Accessibility', () => {
    it('should use semantic main element for content area', () => {
      fixture.detectChanges();

      const main = fixture.debugElement.query(By.css('main'));
      expect(main).toBeTruthy();
    });

    it('should have app content area with proper role', () => {
      fixture.detectChanges();

      const mainContent = fixture.debugElement.query(By.css('.app-content'));
      expect(mainContent).toBeTruthy();
      expect(mainContent.nativeElement.tagName.toLowerCase()).toBe('main');
    });
  });
});
