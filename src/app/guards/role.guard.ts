import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

const dashboardByRole: Record<string, string> = {
  admin: '/admin-dashboard',
  technician: '/technician-dashboard',
  user: '/user-dashboard',
};

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return async () => {
    const router = inject(Router);
    const auth = inject(Auth);

    // Firebase Auth restores any persisted session asynchronously, even
    // though our own localStorage check below is instant. Without waiting
    // here, pages fire their Firestore queries before request.auth is
    // actually populated, so security-rule-gated reads silently come back
    // empty on the very first navigation and only work on a second try.
    await auth.authStateReady();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.role) {
      return router.parseUrl('/login');
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    return router.parseUrl(dashboardByRole[user.role] || '/login');
  };
}
