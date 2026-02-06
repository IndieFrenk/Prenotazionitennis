import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { PageService } from '@app/core/services/page.service';
import { ContactInfo } from '@app/core/models/page.model';

/**
 * Admin contact information component.
 * Loads and allows editing of club contact details (address, phone, email,
 * opening hours, welcome message, and map coordinates).
 */
@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    Textarea,
    InputNumberModule,
    ButtonModule,
    CardModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  templateUrl: './admin-contact.component.html',
  styleUrls: ['./admin-contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminContactComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly pageService = inject(PageService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;

  /** The loaded contact information. */
  contactInfo: ContactInfo | null = null;

  /** Whether the initial data is being loaded. */
  loading = false;

  /** Whether a save operation is in progress. */
  saving = false;

  /** Reactive form for contact info. */
  contactForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadContactInfo();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Save the contact information by calling the API update endpoint.
   */
  save(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Verifica i campi evidenziati e correggi gli errori.'
      });
      return;
    }

    this.saving = true;
    const formValue = this.contactForm.value;

    this.pageService.updateContactInfo(formValue).subscribe({
      next: (updated) => {
        this.contactInfo = updated;
        this.messageService.add({
          severity: 'success',
          summary: 'Salvato',
          detail: 'Informazioni di contatto aggiornate con successo'
        });
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile aggiornare le informazioni di contatto.'
        });
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Check whether a form control is invalid and has been touched.
   * @param controlName - The name of the form control.
   */
  isInvalid(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  /**
   * Whether both latitude and longitude have valid values in the form.
   */
  get hasCoordinates(): boolean {
    const lat = this.contactForm.get('latitude')?.value;
    const lng = this.contactForm.get('longitude')?.value;
    return lat !== null && lat !== undefined && lng !== null && lng !== undefined;
  }

  /**
   * Get the current latitude value from the form.
   */
  get latitudeValue(): number | null {
    return this.contactForm.get('latitude')?.value ?? null;
  }

  /**
   * Get the current longitude value from the form.
   */
  get longitudeValue(): number | null {
    return this.contactForm.get('longitude')?.value ?? null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Initialize the reactive form with validators. */
  private initForm(): void {
    this.contactForm = this.fb.group({
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      openingHours: [''],
      welcomeMessage: [''],
      latitude: [null as number | null],
      longitude: [null as number | null]
    });
  }

  /** Load contact info from the API and patch the form. */
  private loadContactInfo(): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    this.subscription = this.pageService.getContactInfo().subscribe({
      next: (info) => {
        this.contactInfo = info;
        this.contactForm.patchValue({
          address: info.address,
          phone: info.phone,
          email: info.email,
          openingHours: info.openingHours,
          welcomeMessage: info.welcomeMessage,
          latitude: info.latitude,
          longitude: info.longitude
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare le informazioni di contatto.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
