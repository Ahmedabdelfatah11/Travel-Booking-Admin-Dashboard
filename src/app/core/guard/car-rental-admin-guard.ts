import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const carRentalAdminGuard: CanActivateChildFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.hasRole('CarRentalAdmin')) return true;
  return router.createUrlTree(['/login']);
};
