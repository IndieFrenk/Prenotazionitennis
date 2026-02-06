import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { environment } from '@env/environment';

/**
 * Forgot password page component.
 * Allows users to request a password reset link by entering their email.
 * Sends a POST request to /auth/forgot-password.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  /** The reactive forgot-password form. */
  forgotForm!: FormGroup;

  /** Whether the form is currently submitting. */
  submitting = false;

  /** Whether the request was sent successfully. */
  submitted = false;

  /** Error message on failure. */
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Submit the forgot password request.
   * Always shows a generic success message to avoid email enumeration.
   */
  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const email = this.forgotForm.get('email')?.value as string;

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email }).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
      },
      error: () => {
        // Show success even on error to prevent email enumeration
        this.submitted = true;
        this.submitting = false;
      }
    });
  }

  /**
   * Check if a form field is invalid and has been touched.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotForm.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  /** Initialize the reactive form with email validator. */
  private initForm(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
}
