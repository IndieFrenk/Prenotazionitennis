import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Email verification page.
 * Handles the email verification token from the URL and displays the result.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Whether the verification is in progress. */
  loading = true;

  /** Whether the verification was successful. */
  success = false;

  /** Error message if verification failed. */
  errorMessage: string | null = null;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifyEmail(token);
    } else {
      this.loading = false;
      this.errorMessage = 'Token di verifica mancante.';
      this.cdr.markForCheck();
    }
  }

  /** Navigate to login page. */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /** Navigate to resend verification page. */
  goToResend(): void {
    this.router.navigate(['/auth/reinvia-verifica']);
  }

  /** Verify the email using the token. */
  private verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.success = false;
        this.errorMessage = error.error?.messaggio || 'Token di verifica non valido o scaduto.';
        this.cdr.markForCheck();
      }
    });
  }
}
