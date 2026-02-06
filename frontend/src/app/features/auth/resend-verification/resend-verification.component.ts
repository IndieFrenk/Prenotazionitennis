import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Resend verification email page.
 * Allows users to request a new verification email.
 */
@Component({
  selector: 'app-resend-verification',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './resend-verification.component.html',
  styleUrls: ['./resend-verification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResendVerificationComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Email address input. */
  email = '';

  /** Whether the form is being submitted. */
  loading = false;

  /** Success message after submission. */
  successMessage: string | null = null;

  /** Error message if submission fails. */
  errorMessage: string | null = null;

  /** Submit the resend request. */
  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Inserisci un indirizzo email.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.resendVerificationEmail(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.messaggio || 'Se l\'email e\' registrata, riceverai un nuovo link di verifica.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        // Always show success to prevent email enumeration
        this.successMessage = 'Se l\'email e\' registrata e non ancora verificata, riceverai un nuovo link di verifica.';
        this.cdr.markForCheck();
      }
    });
  }

  /** Navigate to login page. */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
