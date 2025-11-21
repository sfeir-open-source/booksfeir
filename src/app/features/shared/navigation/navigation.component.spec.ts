import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection, signal} from '@angular/core';
import {provideRouter} from '@angular/router';
import {NavigationComponent} from './navigation.component';
import {AuthMockService} from '../../../core/services/mock/auth-mock.service';
import {By} from '@angular/platform-browser';
import {vi} from 'vitest';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let authMock: any;

  beforeEach(async () => {
    // Create a signal for the mock user
    const userSignal = signal({
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg'
    });

    const authSpyObj = {
      getUserId: vi.fn()
    };
    // currentUser is a readonly signal, not a method
    Object.defineProperty(authSpyObj, 'currentUser', {
      get: () => userSignal.asReadonly()
    });

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthMockService, useValue: authSpyObj }
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthMockService) as any;
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Logo and App Name', () => {
    it('should display app logo', () => {
      const logo = fixture.debugElement.query(By.css('.logo-image'));
      expect(logo).toBeTruthy();
      expect(logo.nativeElement.src).toContain('favicon.png');
      expect(logo.nativeElement.alt).toBe('Booksfeir Logo');
    });

    it('should display app name', () => {
      const appName = fixture.debugElement.query(By.css('.app-name'));
      expect(appName).toBeTruthy();
      expect(appName.nativeElement.textContent).toBe('Booksfeir');
    });

    it('should have logo link to home', () => {
      const logoLink = fixture.debugElement.query(By.css('.logo-link'));
      expect(logoLink).toBeTruthy();
      expect(logoLink.nativeElement.hasAttribute('routerlink')).toBe(true);
    });
  });

  describe('Navigation Menu', () => {
    it('should display libraries navigation link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-menu a'));
      const librariesLink = links[0];
      expect(librariesLink.nativeElement.textContent).toContain('Libraries');
      expect(librariesLink.nativeElement.hasAttribute('routerlink')).toBe(true);
    });

    it('should display search books navigation link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-menu a'));
      const searchLink = links[1];
      expect(searchLink.nativeElement.textContent).toContain('Search Books');
      expect(searchLink.nativeElement.hasAttribute('routerlink')).toBe(true);
    });

    it('should display my books navigation link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-menu a'));
      const myBooksLink = links[2];
      expect(myBooksLink.nativeElement.textContent).toContain('My Books');
      expect(myBooksLink.nativeElement.hasAttribute('routerlink')).toBe(true);
    });

    it('should display icons for each navigation link', () => {
      const icons = fixture.debugElement.queryAll(By.css('.nav-menu mat-icon'));
      expect(icons.length).toBe(3);
      expect(icons[0].nativeElement.textContent).toBe('home');
      expect(icons[1].nativeElement.textContent).toBe('search');
      expect(icons[2].nativeElement.textContent).toBe('book');
    });
  });

  describe('User Section', () => {
    it('should display user name from auth service', () => {
      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName).toBeTruthy();
      expect(userName.nativeElement.textContent).toBe('Test User');
    });

    it('should display user avatar when available', () => {
      const avatar = fixture.debugElement.query(By.css('.user-avatar'));
      expect(avatar).toBeTruthy();
      expect(avatar.nativeElement.src).toContain('https://example.com/avatar.jpg');
      expect(avatar.nativeElement.alt).toBe('Test User');
    });

    it('should display default icon when avatar not available', () => {
      // Recreate with user without avatar
      const userSignal = signal({
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      });
      Object.defineProperty(authMock, 'currentUser', {
        get: () => userSignal.asReadonly()
      });

      fixture = TestBed.createComponent(NavigationComponent);
      fixture.detectChanges();

      const defaultIcon = fixture.debugElement.query(By.css('.user-avatar-icon'));
      expect(defaultIcon).toBeTruthy();
      expect(defaultIcon.nativeElement.textContent).toBe('account_circle');
    });

    it('should not display user section when no user is logged in', () => {
      const userSignal = signal(null);
      Object.defineProperty(authMock, 'currentUser', {
        get: () => userSignal.asReadonly()
      });

      fixture = TestBed.createComponent(NavigationComponent);
      fixture.detectChanges();

      const userInfo = fixture.debugElement.query(By.css('.user-info'));
      expect(userInfo).toBeFalsy();
    });
  });

  describe('Material Toolbar', () => {
    it('should use Material toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
      expect(toolbar).toBeTruthy();
      expect(toolbar.nativeElement.hasAttribute('color')).toBe(true);
    });

    it('should have sticky positioning class', () => {
      const toolbar = fixture.debugElement.query(By.css('.navigation-toolbar'));
      expect(toolbar).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive toolbar content structure', () => {
      const toolbarContent = fixture.debugElement.query(By.css('.toolbar-content'));
      expect(toolbarContent).toBeTruthy();
    });

    it('should organize sections (logo, nav, user) horizontally', () => {
      const logoSection = fixture.debugElement.query(By.css('.logo-section'));
      const navMenu = fixture.debugElement.query(By.css('.nav-menu'));
      const userSection = fixture.debugElement.query(By.css('.user-section'));

      expect(logoSection).toBeTruthy();
      expect(navMenu).toBeTruthy();
      expect(userSection).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have alt text for logo', () => {
      const logo = fixture.debugElement.query(By.css('.logo-image'));
      expect(logo.nativeElement.alt).toBe('Booksfeir Logo');
    });

    it('should have alt text for user avatar when present', () => {
      const avatar = fixture.debugElement.query(By.css('.user-avatar'));
      expect(avatar.nativeElement.alt).toBe('Test User');
    });

    it('should use semantic nav element for navigation menu', () => {
      const nav = fixture.debugElement.query(By.css('nav'));
      expect(nav).toBeTruthy();
    });
  });
});
