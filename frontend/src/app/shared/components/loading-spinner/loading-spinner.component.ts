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
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255, 255, 255, 0.7);
      z-index: 9999;
    }
  `]
})
export class LoadingSpinnerComponent {}
