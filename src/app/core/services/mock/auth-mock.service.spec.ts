import {TestBed} from '@angular/core/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {AuthMockService} from './auth-mock.service';
import {UserRole} from '../../models/user.model';

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
      expect(user?.id).toBe('admin1');
      expect(user?.name).toBe('Admin User');
      expect(user?.email).toBe('admin@booksfeir.com');
      expect(user?.role).toBe(UserRole.ADMIN);
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
    it('should return true for admin user by default', () => {
      expect(service.isAdmin()).toBe(true);
    });

    it('should return false when switched to regular user', () => {
      service.switchToUser();
      expect(service.isAdmin()).toBe(false);
    });

    it('should return true when switched back to admin', () => {
      service.switchToUser();
      expect(service.isAdmin()).toBe(false);

      service.switchToAdmin();
      expect(service.isAdmin()).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user as Observable', () => {
      service.getCurrentUser().subscribe(user => {
        expect(user).toBeTruthy();
        expect(user?.id).toBe('admin1');

      });
    });

    it('should return null when logged out', () => {
      service.logout().subscribe();

      service.getCurrentUser().subscribe(user => {
        expect(user).toBeNull();

      });
    });
  });

  describe('checkAuth', () => {
    it('should return true when authenticated', () => {
      service.checkAuth().subscribe(isAuth => {
        expect(isAuth).toBe(true);

      });
    });

    it('should return false when not authenticated', () => {
      service.logout().subscribe();

      service.checkAuth().subscribe(isAuth => {
        expect(isAuth).toBe(false);

      });
    });
  });

  describe('login', () => {
    it('should set current user', () => {
      service.logout().subscribe();
      expect(service.currentUser()).toBeNull();

      service.login('test@example.com').subscribe(user => {
        expect(user).toBeTruthy();
        expect(service.currentUser()).toBeTruthy();
        expect(service.isAuthenticated()).toBe(true);

      });
    });

    it('should always return mock user regardless of email', () => {
      service.login('any-email@example.com').subscribe(user => {
        expect(user.email).toBe('admin@booksfeir.com');

      });
    });
  });

  describe('logout', () => {
    it('should clear current user', () => {
      expect(service.currentUser()).toBeTruthy();

      service.logout().subscribe(() => {
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);

      });
    });
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', () => {
      expect(service.getUserId()).toBe('admin1');
    });

    it('should return null when not authenticated', () => {
      service.logout().subscribe();
      expect(service.getUserId()).toBeNull();
    });
  });

  describe('getUserName', () => {
    it('should return user name when authenticated', () => {
      expect(service.getUserName()).toBe('Admin User');
    });

    it('should return null when not authenticated', () => {
      service.logout().subscribe();
      expect(service.getUserName()).toBeNull();
    });
  });

  describe('switchToAdmin', () => {
    it('should switch user to admin role', () => {
      // Start as admin, switch to user, then back to admin
      service.switchToUser();
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
      // Start as admin (default)
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
