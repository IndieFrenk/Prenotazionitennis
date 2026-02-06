import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { PageService } from '@app/core/services/page.service';
import { ContactInfo, ContactFormRequest } from '@app/core/models/page.model';

/**
 * Contact page component.
 * Displays club contact information on the left and a contact form on the right.
 * Submits the form via PageService.sendContactForm().
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    Textarea,
    DividerModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pageService = inject(PageService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Contact information loaded from the server. */
  contactInfo: ContactInfo | null = null;

  /** Whether the contact info is loading. */
  loading = true;

  /** Whether the form is currently submitting. */
  submitting = false;

  /** The reactive contact form. */
  contactForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadContactInfo();
  }

  /**
   * Submit the contact form.
   * Sends the form data to the server and shows a toast notification.
   */
  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const request: ContactFormRequest = this.contactForm.value as ContactFormRequest;

    this.pageService.sendContactForm(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Inviato',
          detail: 'Messaggio inviato con successo'
        });
        this.contactForm.reset();
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile inviare il messaggio. Riprova più tardi.'
        });
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Check if a form field is invalid and has been touched.
   * Used to conditionally display validation error messages.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  /** Initialize the reactive contact form with validators. */
  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /** Load the contact information from the server. */
  private loadContactInfo(): void {
    this.loading = true;
    this.pageService.getContactInfo().subscribe({
      next: (info) => {
        this.contactInfo = info;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
