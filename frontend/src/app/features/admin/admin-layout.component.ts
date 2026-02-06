import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { AuthService } from '@app/core/services/auth.service';
import { User } from '@app/core/models/user.model';

/**
 * Admin layout component.
 * Provides a sidebar with admin navigation links and a <router-outlet> for child content.
 * On mobile the sidebar collapses into a hamburger-driven menu.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    RippleModule,
    TagModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private subscription: Subscription | null = null;

  /** The currently authenticated admin user. */
  currentUser: User | null = null;

  /** Controls mobile sidebar visibility. */
  sidebarOpen = false;

  /** Navigation items displayed in the admin sidebar. */
  readonly navItems = [
    { label: 'Panoramica', route: '/admin/panoramica', icon: 'pi-chart-bar' },
    { label: 'Campi', route: '/admin/campi', icon: 'pi-map' },
    { label: 'Prenotazioni', route: '/admin/prenotazioni', icon: 'pi-calendar' },
    { label: 'Utenti', route: '/admin/utenti', icon: 'pi-users' },
    { label: 'Pagine', route: '/admin/pagine', icon: 'pi-file' },
    { label: 'Contatti', route: '/admin/contatti', icon: 'pi-envelope' }
  ];

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
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
}
