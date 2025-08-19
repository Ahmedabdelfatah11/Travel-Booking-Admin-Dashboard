import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const currentUrl = router.url;

  if (auth.isLoggedIn()) {
    const roles = auth.getRoles(); // ✅ Define 'roles' here!

    if (roles.includes('SuperAdmin')) {
      if (currentUrl === '/login') {
        return router.createUrlTree(['/admin/dashboard']);
      }
      if (currentUrl.startsWith('/admin')) {
        return true;
      }
      return router.createUrlTree(['/admin/dashboard']);
    }

    if (roles.includes('TourAdmin')) {
      if (currentUrl === '/login') {
        return router.createUrlTree(['/tour-admin/dashboard']);
      }
      if (currentUrl.startsWith('/tour-admin')) {
        return true;
      }
      return router.createUrlTree(['/tour-admin/dashboard']);
    }
  }

  return true;
};