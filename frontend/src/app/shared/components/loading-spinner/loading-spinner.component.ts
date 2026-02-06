import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/**
 * Reusable loading spinner component using PrimeNG ProgressSpinner.
 * Renders a centered spinner overlay for use during async operations.
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    <div class="spinner-container">
      <p-progressSpinner
        strokeWidth="4"
        animationDuration="1s"
        ariaLabel="Caricamento in corso"
      />
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      width: 100%;
    }
  `]
})
export class LoadingSpinnerComponent {}
