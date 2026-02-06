import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { AuthService } from '@app/core/services/auth.service';
import { User } from '@app/core/models/user.model';

/**
 * Dashboard layout component.
 * Provides a sidebar with navigation links and a <router-outlet> for child content.
 * On mobile the sidebar collapses into a hamburger-driven menu.
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    RippleModule,
    BadgeModule,
    TagModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private subscription: Subscription | null = null;

  /** The currently authenticated user. */
  currentUser: User | null = null;

  /** Whether the current user has admin privileges. */
  isAdmin = false;

  /** Controls mobile sidebar visibility. */
  sidebarOpen = false;

  /** Navigation items displayed in the sidebar. */
  readonly navItems = [
    { label: 'Il mio profilo', route: '/dashboard/profilo', icon: 'pi-user' },
    { label: 'Le mie prenotazioni', route: '/dashboard/mie-prenotazioni', icon: 'pi-calendar' },
    { label: 'Prenota un campo', route: '/prenotazioni', icon: 'pi-plus' }
  ];

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** Toggle the mobile sidebar open/closed. */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /** Close the sidebar (used after navigation on mobile). */
  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  /**
   * Map the user role string to a human-readable Italian label.
   */
  getRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Amministratore';
      case 'ROLE_MEMBER':
        return 'Socio';
      default:
        return 'Utente Standard';
    }
  }

  /**
   * Map the user role to a PrimeNG Tag severity for visual distinction.
   */
  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'danger';
      case 'ROLE_MEMBER':
        return 'success';
      default:
        return 'info';
    }
  }
}
