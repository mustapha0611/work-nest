import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'status',
    loadComponent: () =>
      import('./features/system-status/system-status-page').then((m) => m.SystemStatusPage),
  },
  // Unknown URLs fall back to the entry route, which the guards then resolve.
  { path: '**', redirectTo: '' },
];
