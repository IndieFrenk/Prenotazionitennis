import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { AuthService } from '@app/core/services/auth.service';
import { LoginRequest } from '@app/core/models/user.model';

/**
 * Login page component.
 * Displays a centered login form with email and password fields.
 * On success, redirects to the returnUrl query parameter or the default dashboard.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  /** The reactive login form. */
  loginForm!: FormGroup;

  /** Whether the form is currently submitting. */
  submitting = false;

  /** Error message to display on failed login. */
  errorMessage: string | null = null;

  /** Whether to show the resend verification link. */
  showResendVerification = false;

  /** The URL to redirect to after successful login. */
  private returnUrl = '/dashboard/profilo';

  ngOnInit(): void {
    this.initForm();
    // Read the returnUrl from query parameters if present
    const urlParam = this.route.snapshot.queryParamMap.get('returnUrl');
    if (urlParam) {
      this.returnUrl = urlParam;
    }
  }

  /**
   * Submit the login form.
   * Authenticates the user and redirects on success.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;
    const request: LoginRequest = this.loginForm.value as LoginRequest;

    this.authService.login(request).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.submitting = false;
        // Check if it's an email verification error (403)
        if (err.status === 403 && err.error?.message?.includes('verificata')) {
          this.errorMessage = err.error.message;
          this.showResendVerification = true;
        } else {
          this.errorMessage = 'Credenziali non valide. Verifica email e password.';
          this.showResendVerification = false;
        }
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Check if a form field is invalid and has been touched.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  /** Initialize the reactive login form with validators. */
  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }
}
