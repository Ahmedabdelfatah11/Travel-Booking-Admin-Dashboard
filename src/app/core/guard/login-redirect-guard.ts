import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const currentUrl = router.url;

  if (!auth.isLoggedIn()) return true;

  const roles = auth.getRoles();

  const roleRedirectMap: Record<string, string> = {
    SuperAdmin: '/admin/dashboard',
    TourAdmin: '/tour-admin/dashboard',
    FlightAdmin: '/flight-admin/dashboard',
    HotelAdmin: '/hotel-admin/dashboard',
    CarRentalAdmin: '/car-admin/dashboard',
  };

  for (const role of roles) {
    const dashboardPath = roleRedirectMap[role];
    if (dashboardPath) {
      const basePath = dashboardPath.split('/dashboard')[0];

      if (currentUrl === '/login') {
        return router.createUrlTree([dashboardPath]);
      }

      if (currentUrl.startsWith(basePath)) {
        return true;
      }

      return router.createUrlTree([dashboardPath]);
    }
  }

  return true;
};