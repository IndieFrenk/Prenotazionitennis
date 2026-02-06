import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { FieldsetModule } from 'primeng/fieldset';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { UserService } from '@app/core/services/user.service';
import { AuthService } from '@app/core/services/auth.service';
import { User, ChangePasswordRequest } from '@app/core/models/user.model';

/**
 * User profile component.
 * Displays user information, allows editing the username,
 * and provides a form for changing the password.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    TagModule,
    FieldsetModule,
    MessageModule,
    ToastModule,
    LoadingSpinnerComponent
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** The loaded user profile. */
  user: User | null = null;

  /** Whether the profile is currently loading. */
  loading = true;

  /** Error message if profile loading fails. */
  errorMessage: string | null = null;

  /** Whether the username is in edit mode. */
  editingUsername = false;

  /** Whether the username update is being submitted. */
  savingUsername = false;

  /** Whether the password change form is being submitted. */
  savingPassword = false;

  /** Reactive form for editing the username. */
  usernameForm!: FormGroup;

  /** Reactive form for changing the password. */
  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  /**
   * Load the user profile from the server.
   */
  loadProfile(): void {
    this.loading = true;
    this.errorMessage = null;

    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.usernameForm.patchValue({ username: user.username });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossibile caricare il profilo. Riprova.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Enter edit mode for the username field.
   */
  startEditUsername(): void {
    if (this.user) {
      this.usernameForm.patchValue({ username: this.user.username });
    }
    this.editingUsername = true;
  }

  /**
   * Cancel editing the username and revert to display mode.
   */
  cancelEditUsername(): void {
    this.editingUsername = false;
    if (this.user) {
      this.usernameForm.patchValue({ username: this.user.username });
    }
  }

  /**
   * Submit the updated username to the server.
   */
  saveUsername(): void {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      return;
    }

    const newUsername = this.usernameForm.get('username')?.value as string;

    // Skip if the username hasn't changed
    if (this.user && newUsername === this.user.username) {
      this.editingUsername = false;
      return;
    }

    this.savingUsername = true;

    this.userService.updateProfile(newUsername).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.authService.updateCurrentUser(updatedUser);
        this.editingUsername = false;
        this.savingUsername = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Profilo aggiornato',
          detail: 'Username modificato con successo.'
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingUsername = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile aggiornare lo username. Riprova.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Submit the password change form.
   */
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword = true;

    const request: ChangePasswordRequest = {
      oldPassword: this.passwordForm.get('oldPassword')?.value as string,
      newPassword: this.passwordForm.get('newPassword')?.value as string,
      confirmPassword: this.passwordForm.get('confirmPassword')?.value as string
    };

    this.userService.changePassword(request).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Password modificata con successo.'
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingPassword = false;
        const detail = err?.error?.message ?? 'Impossibile modificare la password. Verifica i dati inseriti.';
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Map user role to an Italian label.
   */
  getRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Amministratore';
      case 'ROLE_MEMBER':
        return 'Socio';
      default:
        return 'Utente Standard';
    }
  }

  /**
   * Map user role to PrimeNG Tag severity.
   */
  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'danger';
      case 'ROLE_MEMBER':
        return 'success';
      default:
        return 'info';
    }
  }

  /**
   * Map account status to an Italian label.
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Attivo';
      case 'DISABLED':
        return 'Disabilitato';
      default:
        return status;
    }
  }

  /**
   * Map account status to PrimeNG Tag severity.
   */
  getStatusSeverity(status: string): 'success' | 'danger' | 'info' | 'warn' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DISABLED':
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Check whether a specific form field is invalid and touched/dirty.
   */
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  /**
   * Format an ISO date string to a localized Italian date.
   */
  formatDate(dateString: string): string {
    if (!dateString) {
      return '-';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Initialize the username and password reactive forms. */
  private initForms(): void {
    this.usernameForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  /**
   * Custom validator to ensure newPassword and confirmPassword match.
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value as string;
    const confirmPassword = group.get('confirmPassword')?.value as string;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
