import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthMockService } from './auth-mock.service';
import { UserRole } from '../../models/user.model';

describe('AuthMockService', () => {
  let service: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuthMockService
      ]
    });
    service = TestBed.inject(AuthMockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('currentUser signal', () => {
    it('should provide a mock user by default', () => {
      const user = service.currentUser();

      expect(user).toBeTruthy();
      expect(user?.id).toBe('mock-user-1');
      expect(user?.name).toBe('Demo User');
      expect(user?.email).toBe('demo@booksfeir.com');
      expect(user?.role).toBe(UserRole.USER);
    });

    it('should be reactive', () => {
      const initialUser = service.currentUser();
      expect(initialUser).toBeTruthy();

      service.logout().subscribe();
      expect(service.currentUser()).toBeNull();

      service.login('test@example.com').subscribe();
      expect(service.currentUser()).toBeTruthy();
    });
  });

  describe('isAuthenticated computed', () => {
    it('should return true when user is logged in', () => {
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when user is logged out', () => {
      service.logout().subscribe();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should update reactively', () => {
      expect(service.isAuthenticated()).toBe(true);

      service.logout().subscribe();
      expect(service.isAuthenticated()).toBe(false);

      service.login('test@example.com').subscribe();
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('isAdmin computed', () => {
    it('should return false for regular user', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('should return true when switched to admin', () => {
      service.switchToAdmin();
      expect(service.isAdmin()).toBe(true);
    });

    it('should return false when switched back to user', () => {
      service.switchToAdmin();
      expect(service.isAdmin()).toBe(true);

      service.switchToUser();
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user as Observable', (done) => {
      service.getCurrentUser().subscribe(user => {
        expect(user).toBeTruthy();
        expect(user?.id).toBe('mock-user-1');
        done();
      });
    });

    it('should return null when logged out', (done) => {
      service.logout().subscribe();

      service.getCurrentUser().subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('checkAuth', () => {
    it('should return true when authenticated', (done) => {
      service.checkAuth().subscribe(isAuth => {
        expect(isAuth).toBe(true);
        done();
      });
    });

    it('should return false when not authenticated', (done) => {
      service.logout().subscribe();

      service.checkAuth().subscribe(isAuth => {
        expect(isAuth).toBe(false);
        done();
      });
    });
  });

  describe('login', () => {
    it('should set current user', (done) => {
      service.logout().subscribe();
      expect(service.currentUser()).toBeNull();

      service.login('test@example.com').subscribe(user => {
        expect(user).toBeTruthy();
        expect(service.currentUser()).toBeTruthy();
        expect(service.isAuthenticated()).toBe(true);
        done();
      });
    });

    it('should always return mock user regardless of email', (done) => {
      service.login('any-email@example.com').subscribe(user => {
        expect(user.email).toBe('demo@booksfeir.com');
        done();
      });
    });
  });

  describe('logout', () => {
    it('should clear current user', (done) => {
      expect(service.currentUser()).toBeTruthy();

      service.logout().subscribe(() => {
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        done();
      });
    });
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', () => {
      expect(service.getUserId()).toBe('mock-user-1');
    });

    it('should return null when not authenticated', () => {
      service.logout().subscribe();
      expect(service.getUserId()).toBeNull();
    });
  });

  describe('getUserName', () => {
    it('should return user name when authenticated', () => {
      expect(service.getUserName()).toBe('Demo User');
    });

    it('should return null when not authenticated', () => {
      service.logout().subscribe();
      expect(service.getUserName()).toBeNull();
    });
  });

  describe('switchToAdmin', () => {
    it('should switch user to admin role', () => {
      expect(service.isAdmin()).toBe(false);

      service.switchToAdmin();

      const user = service.currentUser();
      expect(user?.role).toBe(UserRole.ADMIN);
      expect(user?.name).toBe('Admin User');
      expect(user?.email).toBe('admin@booksfeir.com');
      expect(service.isAdmin()).toBe(true);
    });
  });

  describe('switchToUser', () => {
    it('should switch admin back to regular user', () => {
      service.switchToAdmin();
      expect(service.isAdmin()).toBe(true);

      service.switchToUser();

      const user = service.currentUser();
      expect(user?.role).toBe(UserRole.USER);
      expect(user?.name).toBe('Demo User');
      expect(user?.email).toBe('demo@booksfeir.com');
      expect(service.isAdmin()).toBe(false);
    });
  });
});
