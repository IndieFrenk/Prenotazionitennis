import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ReservationService } from '@app/core/services/reservation.service';
import { CourtService } from '@app/core/services/court.service';
import { Reservation } from '@app/core/models/reservation.model';
import { Court } from '@app/core/models/court.model';

/**
 * Dropdown option used for filter selects.
 */
interface DropdownOption {
  label: string;
  value: string;
}

/**
 * Admin reservations list component.
 * Displays all reservations in a paginated DataTable with date, court, and
 * status filters plus CSV export and status-change actions.
 */
@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    CalendarModule,
    PaginatorModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TooltipModule,
    DatePipe,
    CurrencyPipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-reservations.component.html',
  styleUrls: ['./admin-reservations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReservationsComponent implements OnInit, OnDestroy {
  private readonly reservationService = inject(ReservationService);
  private readonly courtService = inject(CourtService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;
  private courtsSubscription: Subscription | null = null;

  /** Reservations loaded from the current page. */
  reservations: Reservation[] = [];

  /** Whether data is being loaded. */
  loading = false;

  /** Current page index (0-based). */
  currentPage = 0;

  /** Number of rows per page. */
  pageSize = 10;

  /** Total number of reservations matching the filters. */
  totalRecords = 0;

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------

  /** Selected filter date (null = all dates). */
  selectedDate: Date | null = null;

  /** Selected court ID filter (empty string = all courts). */
  selectedCourtId = '';

  /** Selected status filter (empty string = all statuses). */
  selectedStatus = '';

  /** Court dropdown options built from the API. */
  courtOptions: DropdownOption[] = [];

  /** Status dropdown options. */
  readonly statusOptions: DropdownOption[] = [
    { label: 'Tutte', value: '' },
    { label: 'Confermate', value: 'CONFERMATA' },
    { label: 'Cancellate', value: 'CANCELLATA' },
    { label: 'Completate', value: 'COMPLETATA' }
  ];

  ngOnInit(): void {
    this.loadCourts();
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.courtsSubscription?.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Filter actions
  // ---------------------------------------------------------------------------

  /** Apply filters and reload from the first page. */
  applyFilters(): void {
    this.currentPage = 0;
    this.loadReservations();
  }

  /** Reset all filters and reload. */
  resetFilters(): void {
    this.selectedDate = null;
    this.selectedCourtId = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadReservations();
  }

  // ---------------------------------------------------------------------------
  // Paginator
  // ---------------------------------------------------------------------------

  /**
   * Handle paginator page change events.
   * @param event - The paginator state change event.
   */
  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? 10;
    this.loadReservations();
  }

  // ---------------------------------------------------------------------------
  // Reservation actions
  // ---------------------------------------------------------------------------

  /**
   * Mark a reservation as COMPLETATA.
   * @param reservation - The reservation to complete.
   */
  completeReservation(reservation: Reservation): void {
    this.reservationService.updateReservationStatus(reservation.id, 'COMPLETATA').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Completata',
          detail: 'La prenotazione e stata completata.'
        });
        this.loadReservations();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile completare la prenotazione.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Prompt for cancellation confirmation, then cancel the reservation.
   * @param reservation - The reservation to cancel.
   */
  confirmCancel(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Sei sicuro di voler cancellare la prenotazione di "${reservation.username}" del ${reservation.reservationDate}?`,
      header: 'Conferma cancellazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancella',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelReservation(reservation)
    });
  }

  // ---------------------------------------------------------------------------
  // CSV export
  // ---------------------------------------------------------------------------

  /** Export the current reservation list as a CSV file and trigger download. */
  exportCsv(): void {
    const headers = ['ID', 'Utente', 'Campo', 'Tipo', 'Data', 'Inizio', 'Fine', 'Stato', 'Prezzo'];
    const rows = this.reservations.map(r => [
      r.id,
      r.username,
      r.courtName,
      r.courtType,
      r.reservationDate,
      r.startTime,
      r.endTime,
      r.status,
      r.paidPrice.toFixed(2)
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prenotazioni_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.messageService.add({
      severity: 'info',
      summary: 'Esportazione',
      detail: `${this.reservations.length} prenotazioni esportate in CSV.`
    });
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  /**
   * Return the first 8 characters of a reservation ID.
   * @param id - The full UUID string.
   */
  shortId(id: string): string {
    return id.substring(0, 8);
  }

  /**
   * Return a PrimeNG severity for a reservation status tag.
   * @param status - The reservation status string.
   */
  getStatusSeverity(status: string): 'success' | 'danger' | 'info' | 'warn' {
    switch (status) {
      case 'CONFERMATA':
        return 'success';
      case 'CANCELLATA':
        return 'danger';
      case 'COMPLETATA':
        return 'info';
      default:
        return 'warn';
    }
  }

  /**
   * Return the Italian label for a reservation status.
   * @param status - The reservation status string.
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFERMATA':
        return 'Confermata';
      case 'CANCELLATA':
        return 'Cancellata';
      case 'COMPLETATA':
        return 'Completata';
      default:
        return status;
    }
  }

  /**
   * Return a PrimeNG severity for a court type tag.
   * @param type - The court type string.
   */
  getTypeSeverity(type: string): 'info' | 'success' {
    return type === 'PADEL' ? 'success' : 'info';
  }

  /**
   * Format a price as Euro currency.
   * @param value - Numeric amount.
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Load courts for the filter dropdown. */
  private loadCourts(): void {
    this.courtsSubscription?.unsubscribe();
    this.courtsSubscription = this.courtService.getAllCourts().subscribe({
      next: (courts: Court[]) => {
        this.courtOptions = [
          { label: 'Tutti i campi', value: '' },
          ...courts.map(c => ({ label: c.name, value: c.id }))
        ];
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare la lista dei campi.'
        });
      }
    });
  }

  /** Load reservations from the API with current filters and pagination. */
  private loadReservations(): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    const dateStr = this.selectedDate
      ? this.formatDate(this.selectedDate)
      : undefined;

    this.subscription = this.reservationService.getAllReservations({
      courtId: this.selectedCourtId || undefined,
      date: dateStr,
      status: this.selectedStatus || undefined,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (response) => {
        this.reservations = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare le prenotazioni.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Cancel a reservation via the admin API. */
  private cancelReservation(reservation: Reservation): void {
    this.reservationService.adminCancelReservation(reservation.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cancellata',
          detail: 'La prenotazione e stata cancellata.'
        });
        this.loadReservations();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile cancellare la prenotazione.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Format a Date object as yyyy-MM-dd string for the API.
   * @param date - The Date to format.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
