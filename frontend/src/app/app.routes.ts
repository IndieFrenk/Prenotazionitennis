import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Top-level route definitions for the Tennis Club application.
 * Uses lazy loading for all feature components to optimize initial bundle size.
 */
export const routes: Routes = [
  // -- Redirect root to home --
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // -- Public pages --
  {
    path: 'home',
    loadComponent: () =>
      import('./features/public/home/home.component').then(m => m.PublicHomeComponent)
  },
  {
    path: 'campi',
    loadComponent: () =>
      import('./features/public/courts/court-list.component').then(m => m.CourtListComponent)
  },
  {
    path: 'campi/:id',
    loadComponent: () =>
      import('./features/public/courts/court-detail.component').then(m => m.CourtDetailComponent)
  },
  {
    path: 'chi-siamo',
    loadComponent: () =>
      import('./features/public/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contatti',
    loadComponent: () =>
      import('./features/public/contact/contact.component').then(m => m.ContactComponent)
  },

  // -- Authentication pages --
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registrazione',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'recupera-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'auth/verifica-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'auth/reinvia-verifica',
    loadComponent: () =>
      import('./features/auth/resend-verification/resend-verification.component').then(m => m.ResendVerificationComponent)
  },
  {
    path: 'auth/login',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // -- Booking pages (authenticated users) --
  {
    path: 'prenotazioni',
    loadComponent: () =>
      import('./features/booking/booking.component').then(m => m.BookingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'prenotazioni/campo/:courtId',
    loadComponent: () =>
      import('./features/booking/court-booking/court-booking.component').then(m => m.CourtBookingComponent),
    canActivate: [authGuard]
  },

  // -- User dashboard (authenticated users) --
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'profilo',
        pathMatch: 'full'
      },
      {
        path: 'profilo',
        loadComponent: () =>
          import('./features/dashboard/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'mie-prenotazioni',
        loadComponent: () =>
          import('./features/dashboard/my-reservations/my-reservations.component').then(m => m.MyReservationsComponent)
      }
    ]
  },

  // -- Admin panel (admin users only) --
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'panoramica',
        pathMatch: 'full'
      },
      {
        path: 'panoramica',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'campi',
        loadComponent: () =>
          import('./features/admin/courts/admin-courts.component').then(m => m.AdminCourtsComponent)
      },
      {
        path: 'campi/:id',
        loadComponent: () =>
          import('./features/admin/courts/admin-court-edit.component').then(m => m.AdminCourtEditComponent)
      },
      {
        path: 'prenotazioni',
        loadComponent: () =>
          import('./features/admin/reservations/admin-reservations.component').then(m => m.AdminReservationsComponent)
      },
      {
        path: 'utenti',
        loadComponent: () =>
          import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'pagine',
        loadComponent: () =>
          import('./features/admin/pages/admin-pages.component').then(m => m.AdminPagesComponent)
      },
      {
        path: 'pagine/:slug',
        loadComponent: () =>
          import('./features/admin/pages/admin-page-edit.component').then(m => m.AdminPageEditComponent)
      },
      {
        path: 'contatti',
        loadComponent: () =>
          import('./features/admin/contact/admin-contact.component').then(m => m.AdminContactComponent)
      }
    ]
  },

  // -- Wildcard / 404 --
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
