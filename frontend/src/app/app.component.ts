import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

/**
 * Root application component.
 * Provides the main layout shell with router outlet and global toast notifications.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  providers: [MessageService],
  template: `
    <!-- Global toast notification container -->
    <p-toast position="top-right" />

    <!-- Main application content rendered by the router -->
    <router-outlet />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
  readonly title = 'Tennis Club';
}
