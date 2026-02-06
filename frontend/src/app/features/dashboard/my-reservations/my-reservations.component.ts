import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { ReservationService } from '@app/core/services/reservation.service';
import { Reservation } from '@app/core/models/reservation.model';

/** Option type for the status filter SelectButton. */
interface StatusOption {
  label: string;
  value: string;
}

/**
 * My Reservations component.
 * Displays a paginated, filterable list of the current user's reservations
 * with the ability to cancel future confirmed bookings.
 */
@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    CardModule,
    PaginatorModule,
    SelectButtonModule,
    ConfirmDialogModule,
    ToastModule,
    LoadingSpinnerComponent
  ],
  providers: [ConfirmationService, MessageService, DatePipe, CurrencyPipe],
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyReservationsComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Full list of reservations for the current page from the API. */
  reservations: Reservation[] = [];

  /** Reservations filtered by the selected status. */
  filteredReservations: Reservation[] = [];

  /** Whether data is currently being loaded. */
  loading = true;

  /** Error message displayed on load failure. */
  errorMessage: string | null = null;

  /** ID of the reservation currently being cancelled (for loading state). */
  cancellingId: string | null = null;

  // Pagination state
  currentPage = 0;
  pageSize = 10;
  totalRecords = 0;

  /** Currently selected status filter value. */
  selectedStatus = 'ALL';

  /** Options for the status filter SelectButton. */
  readonly statusOptions: StatusOption[] = [
    { label: 'Tutte', value: 'ALL' },
    { label: 'Confermate', value: 'CONFERMATA' },
    { label: 'Cancellate', value: 'CANCELLATA' },
    { label: 'Completate', value: 'COMPLETATA' }
  ];

  ngOnInit(): void {
    this.loadReservations();
  }

  /**
   * Fetch the user's reservations from the API.
   */
  loadReservations(): void {
    this.loading = true;
    this.errorMessage = null;

    this.reservationService.getMyReservations(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        // Sort by date descending (most recent first)
        this.reservations = response.content.sort((a, b) => {
          const dateCompare = b.reservationDate.localeCompare(a.reservationDate);
          if (dateCompare !== 0) {
            return dateCompare;
          }
          return b.startTime.localeCompare(a.startTime);
        });
        this.totalRecords = response.totalElements;
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossibile caricare le prenotazioni. Riprova.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Handle page change from the paginator.
   */
  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? 10;
    this.loadReservations();
  }

  /**
   * Handle status filter change.
   */
  onStatusFilterChange(): void {
    this.applyFilter();
  }

  /**
   * Show a confirmation dialog before cancelling a reservation.
   */
  confirmCancel(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler cancellare questa prenotazione?',
      header: 'Conferma cancellazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancella',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cancelReservation(reservation);
      }
    });
  }

  /**
   * Determine whether a reservation can be cancelled.
   * Only confirmed reservations with a future date can be cancelled.
   */
  canCancel(reservation: Reservation): boolean {
    if (reservation.status !== 'CONFERMATA') {
      return false;
    }
    const now = new Date();
    const reservationDateTime = new Date(`${reservation.reservationDate}T${reservation.startTime}`);
    return reservationDateTime > now;
  }

  /**
   * Map a reservation status to a PrimeNG Tag severity.
   */
  getStatusSeverity(status: string): 'success' | 'danger' | 'info' | 'warn' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'CONFERMATA':
        return 'success';
      case 'CANCELLATA':
        return 'danger';
      case 'COMPLETATA':
        return 'info';
      default:
        return 'secondary';
    }
  }

  /**
   * Map a reservation status to an Italian label.
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
   * Map a court type to an Italian label.
   */
  getCourtTypeLabel(type: string): string {
    switch (type) {
      case 'TENNIS':
        return 'Tennis';
      case 'PADEL':
        return 'Padel';
      default:
        return type;
    }
  }

  /**
   * Map a court type to a PrimeNG Tag severity.
   */
  getCourtTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (type) {
      case 'TENNIS':
        return 'success';
      case 'PADEL':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Format a date string for display in Italian locale.
   */
  formatDate(dateString: string): string {
    if (!dateString) {
      return '-';
    }
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Format a time range for display (e.g. "09:00 - 10:00").
   */
  formatTimeRange(start: string, end: string): string {
    return `${start.substring(0, 5)} - ${end.substring(0, 5)}`;
  }

  /**
   * Format a price for display in EUR.
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Apply the currently selected status filter to the full reservation list.
   */
  private applyFilter(): void {
    if (this.selectedStatus === 'ALL') {
      this.filteredReservations = [...this.reservations];
    } else {
      this.filteredReservations = this.reservations.filter(r => r.status === this.selectedStatus);
    }
    this.cdr.markForCheck();
  }

  /**
   * Execute the cancellation API call for a reservation.
   */
  private cancelReservation(reservation: Reservation): void {
    this.cancellingId = reservation.id;
    this.cdr.markForCheck();

    this.reservationService.cancelReservation(reservation.id).subscribe({
      next: () => {
        this.cancellingId = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Prenotazione cancellata',
          detail: 'La prenotazione è stata cancellata con successo.'
        });
        // Reload the list to get the updated status
        this.loadReservations();
      },
      error: () => {
        this.cancellingId = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile cancellare la prenotazione. Riprova.'
        });
        this.cdr.markForCheck();
      }
    });
  }
}
