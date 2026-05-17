import { Routes } from '@angular/router';
import { authenticationGuard } from './iam/services/authentication.guard';
import { adminGuard } from './iam/services/admin.guard';

export const routes: Routes = [
  // === IAM Routes (Web App) ===
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./iam/pages/sign-in/sign-in.component').then(m => m.SignInComponent),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./iam/pages/sign-up/sign-up.component').then(m => m.SignUpComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./iam/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./iam/pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },

  // === Protected Routes (Web App) ===
  {
    path: 'user/home',
    loadComponent: () =>
      import('./public/pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authenticationGuard],
  },

  // === Driver / Tablet Routes (Public - No Auth) ===
  {
    path: 'driver/home',
    loadComponent: () =>
      import('./recognition/pages/driver-home/driver-home.component').then(m => m.DriverHomeComponent),
  },
  {
    path: 'driver/exit/menu',
    loadComponent: () =>
      import('./payment/pages/driver-exit-menu/driver-exit-menu.component').then(m => m.DriverExitMenuComponent),
  },
  {
    path: 'driver/exit/pay',
    loadComponent: () =>
      import('./payment/pages/driver-exit-pay/driver-exit-pay.component').then(m => m.DriverExitPayComponent),
  },

  // === Shared Routes ===
  {
    path: 'thanks',
    loadComponent: () =>
      import('./reservations/pages/thanks/thanks.component').then(m => m.ThanksComponent),
  },

  // === Admin Routes (Web App) ===
  {
    path: 'admin/home',
    loadComponent: () =>
      import('./parking/pages/admin-home/admin-home.component').then(m => m.AdminHomeComponent),
    canActivate: [adminGuard],
  },

  // === Default & Wildcard ===
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: '**', redirectTo: 'sign-in' },
];
