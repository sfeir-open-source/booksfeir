import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthMockService} from '../services/mock/auth-mock.service';

export const manageContentGuard: CanActivateFn = () => {
  const authService = inject(AuthMockService);
  const router = inject(Router);

  if (authService.rigthOfManage()) {
    return true;
  }

  // Redirect non-admin users to home page
  return router.createUrlTree(['/']);
};
