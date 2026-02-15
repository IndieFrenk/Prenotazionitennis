import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { AuthService } from '@app/core/services/auth.service';
import { RegisterRequest } from '@app/core/models/user.model';

/**
 * Registration page component.
 * Displays a centered registration form with username, email, password,
 * and confirm password fields. On success, auto-logs in and redirects to dashboard.
 */
@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** The reactive registration form. */
  registerForm!: FormGroup;

  /** Whether the form is currently submitting. */
  submitting = false;

  /** Error message to display on failed registration. */
  errorMessage: string | null = null;

  /** Success message to display after successful registration. */
  successMessage: string | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Submit the registration form.
   * Registers the user (which also auto-logs in) and redirects to dashboard.
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const formValue = this.registerForm.value;
    const request: RegisterRequest = {
      username: formValue.username as string,
      email: formValue.email as string,
      password: formValue.password as string
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.submitting = false;
        this.successMessage = response.messaggio || 'Registrazione completata! Controlla la tua email per verificare l\'account.';
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Try to extract a meaningful error message from the response
        if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Registrazione fallita. Riprova piu\' tardi.';
        }
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Check if a form field is invalid and has been touched.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  /**
   * Check if the confirm password field has a mismatch error.
   */
  hasPasswordMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') &&
      (this.registerForm.get('confirmPassword')?.dirty || this.registerForm.get('confirmPassword')?.touched) === true;
  }

  /** Initialize the reactive registration form with validators. */
  private initForm(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,;:_\-])/)]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: [RegisterComponent.passwordMatchValidator]
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
