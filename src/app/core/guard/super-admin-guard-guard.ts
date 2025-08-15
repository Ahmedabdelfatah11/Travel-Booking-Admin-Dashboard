import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { isPlatformBrowser } from '@angular/common';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // ❌ During SSR, block
  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  // ✅ Check login and role from localStorage
  if (authService.isLoggedIn() && authService.hasRole('SuperAdmin')) {
    return true;
  }

  // ❌ No access → redirect
  router.navigate(['/login']); // or '/unauthorized' if you prefer
  return false;
};

