import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourtService } from '@app/core/services/court.service';
import { Court, CourtPhoto, CourtRequest } from '@app/core/models/court.model';

/**
 * Admin court edit/create component.
 * If the route param :id is 'new', the component runs in create mode.
 * Otherwise it loads the court by ID and pre-fills the form for editing.
 * Also manages court photos (upload, delete) when in edit mode.
 */
@Component({
  selector: 'app-admin-court-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    Textarea,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    FileUploadModule,
    ToastModule,
    CardModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-court-edit.component.html',
  styleUrls: ['./admin-court-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCourtEditComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courtService = inject(CourtService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;

  /** Whether the component is in create mode (true) or edit mode (false). */
  isCreateMode = true;

  /** The court ID being edited (null in create mode). */
  courtId: string | null = null;

  /** The loaded court data (edit mode only). */
  court: Court | null = null;

  /** Whether the initial data is being loaded. */
  loading = false;

  /** Whether a save operation is in progress. */
  saving = false;

  /** Reactive form for court data. */
  courtForm!: FormGroup;

  /** Court type dropdown options. */
  readonly typeOptions = [
    { label: 'Tennis', value: 'TENNIS' },
    { label: 'Padel', value: 'PADEL' }
  ];

  /** Court status dropdown options. */
  readonly statusOptions = [
    { label: 'Attivo', value: 'ATTIVO' },
    { label: 'In manutenzione', value: 'MANUTENZIONE' }
  ];

  /** Maximum number of photos per court. */
  readonly maxPhotos = 5;

  /** Alt text for the photo being uploaded. */
  photoAltText = '';

  /** Display order for the photo being uploaded. */
  photoDisplayOrder = 1;

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isCreateMode = false;
      this.courtId = id;
      this.loadCourt(id);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** Page title based on mode. */
  get pageTitle(): string {
    return this.isCreateMode ? 'Nuovo Campo' : 'Modifica Campo';
  }

  /** Page subtitle based on mode. */
  get pageSubtitle(): string {
    return this.isCreateMode
      ? 'Compila i dati per creare un nuovo campo'
      : 'Modifica i dati del campo selezionato';
  }

  /** Whether the photo upload section should be shown (edit mode + court loaded). */
  get showPhotoSection(): boolean {
    return !this.isCreateMode && this.court !== null;
  }

  /** Photos of the loaded court. */
  get photos(): CourtPhoto[] {
    return this.court?.photos ?? [];
  }

  /** Whether the maximum number of photos has been reached. */
  get maxPhotosReached(): boolean {
    return this.photos.length >= this.maxPhotos;
  }

  /**
   * Save the court (create or update).
   */
  save(): void {
    if (this.courtForm.invalid) {
      this.courtForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Compila tutti i campi obbligatori.'
      });
      return;
    }

    this.saving = true;
    const request = this.buildRequest();

    if (this.isCreateMode) {
      this.courtService.createCourt(request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Creato',
            detail: 'Il campo e stato creato con successo.'
          });
          this.saving = false;
          this.cdr.markForCheck();
          // Navigate back to the list after a short delay for the toast
          setTimeout(() => void this.router.navigate(['/admin/campi']), 1200);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile creare il campo.'
          });
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.courtService.updateCourt(this.courtId!, request).subscribe({
        next: (updated) => {
          this.court = updated;
          this.messageService.add({
            severity: 'success',
            summary: 'Aggiornato',
            detail: 'Il campo e stato aggiornato con successo.'
          });
          this.saving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile aggiornare il campo.'
          });
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  /**
   * Navigate back to the courts list.
   */
  cancel(): void {
    void this.router.navigate(['/admin/campi']);
  }

  /**
   * Handle photo upload via PrimeNG FileUpload custom handler.
   * @param event - The file upload handler event.
   */
  onPhotoUpload(event: FileUploadHandlerEvent): void {
    const file = event.files[0];
    if (!file || !this.courtId) return;

    this.courtService.uploadPhoto(
      this.courtId,
      file,
      this.photoDisplayOrder,
      this.photoAltText
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Foto caricata',
          detail: 'La foto e stata caricata con successo.'
        });
        this.photoAltText = '';
        this.photoDisplayOrder = this.photos.length + 1;
        // Reload court to refresh photos
        this.loadCourt(this.courtId!);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare la foto.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Prompt for confirmation, then delete a photo.
   * @param photo - The photo to delete.
   */
  confirmDeletePhoto(photo: CourtPhoto): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questa foto?',
      header: 'Conferma eliminazione foto',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deletePhoto(photo)
    });
  }

  /**
   * Check whether a form control is invalid and has been touched.
   * @param controlName - The name of the form control.
   */
  isInvalid(controlName: string): boolean {
    const control = this.courtForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Initialize the reactive form. */
  private initForm(): void {
    this.courtForm = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      tipo: ['TENNIS', Validators.required],
      descrizione: ['', Validators.maxLength(500)],
      stato: ['ATTIVO', Validators.required],
      prezzoBase: [0, [Validators.required, Validators.min(0)]],
      prezzoSocio: [0, [Validators.required, Validators.min(0)]],
      orarioApertura: [null as Date | null, Validators.required],
      orarioChiusura: [null as Date | null, Validators.required],
      durataSlot: [60, [Validators.required, Validators.min(30)]],
      ordineVisualizzazione: [1, [Validators.min(0)]]
    });
  }

  /** Load a court by ID and patch the form. */
  private loadCourt(id: string): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    this.subscription = this.courtService.getCourtById(id).subscribe({
      next: (court) => {
        this.court = court;
        this.patchForm(court);
        this.photoDisplayOrder = court.photos.length + 1;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare i dati del campo.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Fill the form with existing court data. */
  private patchForm(court: Court): void {
    this.courtForm.patchValue({
      nome: court.name,
      tipo: court.type,
      descrizione: court.description ?? '',
      stato: court.status,
      prezzoBase: court.basePrice,
      prezzoSocio: court.memberPrice,
      orarioApertura: this.parseTimeString(court.openingTime),
      orarioChiusura: this.parseTimeString(court.closingTime),
      durataSlot: court.slotDurationMinutes,
      ordineVisualizzazione: court.displayOrder
    });
  }

  /** Build a CourtRequest from the current form values. */
  private buildRequest(): CourtRequest {
    const v = this.courtForm.value;
    return {
      name: v.nome,
      type: v.tipo,
      description: v.descrizione ?? undefined,
      basePrice: v.prezzoBase,
      memberPrice: v.prezzoSocio,
      openingTime: this.formatTime(v.orarioApertura),
      closingTime: this.formatTime(v.orarioChiusura),
      slotDurationMinutes: v.durataSlot,
      displayOrder: v.ordineVisualizzazione,
      status: v.stato
    };
  }

  /**
   * Parse a time string (HH:mm) into a Date object for PrimeNG Calendar timeOnly.
   * @param time - Time string in HH:mm format.
   */
  private parseTimeString(time: string): Date | null {
    if (!time) return null;
    const parts = time.split(':');
    if (parts.length < 2) return null;
    const date = new Date();
    date.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    return date;
  }

  /**
   * Format a Date object as HH:mm string.
   * @param date - The Date object.
   */
  private formatTime(date: Date | null): string {
    if (!date) return '00:00';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /** Delete a court photo via the API. */
  private deletePhoto(photo: CourtPhoto): void {
    this.courtService.deletePhoto(photo.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminata',
          detail: 'La foto e stata eliminata.'
        });
        // Reload court to refresh photos
        if (this.courtId) {
          this.loadCourt(this.courtId);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile eliminare la foto.'
        });
      }
    });
  }
}
