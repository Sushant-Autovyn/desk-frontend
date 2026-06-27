import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.user()?.role;
    if (!role || !allowedRoles.includes(role)) {
      return router.createUrlTree([role === 'admin' ? '/admin/dashboard' : '/agent/dashboard']);
    }

    return true;
  };
};
