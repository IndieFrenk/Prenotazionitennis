import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * 404 Not Found page displayed for unmatched routes.
 * Provides a link back to the home page.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <i class="pi pi-exclamation-triangle not-found-icon"></i>
        <h1>404</h1>
        <h2>Pagina non trovata</h2>
        <p>La pagina che stai cercando non esiste o è stata spostata.</p>
        <p-button
          label="Torna alla Home"
          icon="pi pi-home"
          routerLink="/home"
          severity="primary"
        />
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 2rem;
    }

    .not-found-content {
      text-align: center;
    }

    .not-found-icon {
      font-size: 4rem;
      color: var(--yellow-500);
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 4rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
    }

    h2 {
      font-size: 1.5rem;
      color: var(--text-color);
      margin: 0.5rem 0;
    }

    p {
      color: var(--text-color-secondary);
      margin-bottom: 2rem;
    }
  `]
})
export class NotFoundComponent {}
