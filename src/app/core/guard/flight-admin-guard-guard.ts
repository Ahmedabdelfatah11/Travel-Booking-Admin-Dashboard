import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const flightAdminGuardGuard: CanActivateChildFn = () =>  {
 const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.hasRole('FlightAdmin')) return true;
  return router.createUrlTree(['/login']);
};
