// super-admin-guard-guard.ts
import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const superAdminGuard: CanActivateChildFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.hasRole('SuperAdmin')) return true;
  return router.createUrlTree(['/login']);
};