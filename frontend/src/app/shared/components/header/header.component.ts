import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@app/core/services/auth.service';
import { User } from '@app/core/models/user.model';

/**
 * Application header with PrimeNG Menubar.
 * Shows navigation links, authentication buttons, and a user dropdown menu.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MenubarModule, ButtonModule, MenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private subscription: Subscription | null = null;

  /** Main navigation items shown in the menubar. */
  navItems: MenuItem[] = [];

  /** Dropdown items for the authenticated user menu. */
  userMenuItems: MenuItem[] = [];

  /** The currently logged-in user, or null. */
  currentUser: User | null = null;

  /** Whether a user is currently authenticated. */
  isLoggedIn = false;

  ngOnInit(): void {
    this.buildNavItems();

    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = user !== null;
      this.buildUserMenu();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** Log the user out via the auth service. */
  onLogout(): void {
    this.authService.logout();
  }

  /** Build the main navigation menu items. */
  private buildNavItems(): void {
    this.navItems = [
      { label: 'Home', routerLink: '/home', icon: 'pi pi-home' },
      { label: 'I nostri campi', routerLink: '/campi', icon: 'pi pi-th-large' },
      { label: 'Chi siamo', routerLink: '/chi-siamo', icon: 'pi pi-info-circle' },
      { label: 'Contatti', routerLink: '/contatti', icon: 'pi pi-envelope' }
    ];
  }

  /** Build the user dropdown menu based on current role. */
  private buildUserMenu(): void {
    if (!this.currentUser) {
      this.userMenuItems = [];
      return;
    }

    this.userMenuItems = [
      { label: 'Profilo', routerLink: '/dashboard/profilo', icon: 'pi pi-user' },
      { label: 'Le mie prenotazioni', routerLink: '/dashboard/mie-prenotazioni', icon: 'pi pi-calendar' }
    ];

    // Show admin dashboard link only for admin users
    if (this.authService.isAdmin()) {
      this.userMenuItems.push({
        label: 'Pannello Admin',
        routerLink: '/admin',
        icon: 'pi pi-cog'
      });
    }

    this.userMenuItems.push({ separator: true });
    this.userMenuItems.push({
      label: 'Esci',
      icon: 'pi pi-sign-out',
      command: () => this.onLogout()
    });
  }
}
