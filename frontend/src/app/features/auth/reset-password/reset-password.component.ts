import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { environment } from '@env/environment';

/**
 * Reset password page component.
 * Reads a reset token from query params and allows the user to set a new password.
 * On success, redirects to login with a success message.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    PasswordModule,
    MessageModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  /** The reactive reset-password form. */
  resetForm!: FormGroup;

  /** Whether the form is currently submitting. */
  submitting = false;

  /** Error message on failure. */
  errorMessage: string | null = null;

  /** The reset token extracted from query params. */
  private token = '';

  /** Whether the token is missing (invalid link). */
  tokenMissing = false;

  ngOnInit(): void {
    this.initForm();

    // Read the token from query parameters
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (!tokenParam) {
      this.tokenMissing = true;
    } else {
      this.token = tokenParam;
    }
  }

  /**
   * Submit the reset password form.
   * Sends the new password and token to the server.
   */
  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const newPassword = this.resetForm.get('password')?.value as string;

    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token: this.token,
      newPassword
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Password aggiornata',
          detail: 'La tua password è stata reimpostata con successo. Effettua il login.'
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 400 || err.status === 404) {
          this.errorMessage = 'Il link di reset non è valido o è scaduto. Richiedi un nuovo link.';
        } else {
          this.errorMessage = 'Si è verificato un errore. Riprova più tardi.';
        }
        this.submitting = false;
      }
    });
  }

  /**
   * Check if a form field is invalid and has been touched.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  /**
   * Check if the confirm password field has a mismatch error.
   */
  hasPasswordMismatch(): boolean {
    return this.resetForm.hasError('passwordMismatch') &&
      (this.resetForm.get('confirmPassword')?.dirty || this.resetForm.get('confirmPassword')?.touched) === true;
  }

  /** Initialize the reactive form with password validators. */
  private initForm(): void {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: [ResetPasswordComponent.passwordMatchValidator]
      }
    );
  }

  /**
   * Custom validator that checks whether the password and confirmPassword fields match.
   */
  private static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string;
    const confirmPassword = control.get('confirmPassword')?.value as string;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
