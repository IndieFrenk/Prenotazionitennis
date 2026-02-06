import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourtService } from '@app/core/services/court.service';
import { Court } from '@app/core/models/court.model';

/**
 * Admin courts list component.
 * Displays all courts in a DataTable with CRUD actions, status filtering,
 * and display-order management via up/down arrows.
 */
@Component({
  selector: 'app-admin-courts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    DropdownModule,
    ProgressSpinnerModule,
    TooltipModule,
    CurrencyPipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-courts.component.html',
  styleUrls: ['./admin-courts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCourtsComponent implements OnInit, OnDestroy {
  private readonly courtService = inject(CourtService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;

  /** Full list of courts loaded from the API. */
  courts: Court[] = [];

  /** Courts filtered by the selected status. */
  filteredCourts: Court[] = [];

  /** Whether courts are being loaded. */
  loading = false;

  /** Currently selected status filter value. */
  selectedStatus = 'TUTTI';

  /** Options for the status filter dropdown. */
  readonly statusOptions = [
    { label: 'Tutti', value: 'TUTTI' },
    { label: 'Attivi', value: 'ATTIVO' },
    { label: 'In manutenzione', value: 'MANUTENZIONE' }
  ];

  ngOnInit(): void {
    this.loadCourts();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Navigate to the court creation form.
   */
  createCourt(): void {
    void this.router.navigate(['/admin/campi', 'new']);
  }

  /**
   * Navigate to the court edit form.
   * @param court - The court to edit.
   */
  editCourt(court: Court): void {
    void this.router.navigate(['/admin/campi', court.id]);
  }

  /**
   * Prompt the user for delete confirmation, then delete the court.
   * @param court - The court to delete.
   */
  confirmDelete(court: Court): void {
    this.confirmationService.confirm({
      message: `Sei sicuro di voler eliminare il campo "${court.name}"? Questa azione non puo essere annullata.`,
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteCourt(court)
    });
  }

  /**
   * Move a court up in display order (decrease ordineVisualizzazione).
   * @param court - The court to move.
   * @param index - Current index in the filtered list.
   */
  moveUp(court: Court, index: number): void {
    if (index <= 0) return;
    const newOrder = court.displayOrder - 1;
    this.updateOrder(court, newOrder);
  }

  /**
   * Move a court down in display order (increase ordineVisualizzazione).
   * @param court - The court to move.
   * @param index - Current index in the filtered list.
   */
  moveDown(court: Court, index: number): void {
    if (index >= this.filteredCourts.length - 1) return;
    const newOrder = court.displayOrder + 1;
    this.updateOrder(court, newOrder);
  }

  /**
   * Apply the selected status filter to the courts list.
   */
  onStatusFilterChange(): void {
    this.applyFilter();
  }

  /**
   * Return a PrimeNG severity for a court status tag.
   * @param status - The court status string.
   */
  getStatusSeverity(status: string): 'success' | 'warn' | 'info' {
    switch (status) {
      case 'ATTIVO':
        return 'success';
      case 'MANUTENZIONE':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Return the Italian label for a court status.
   * @param status - The court status string.
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'ATTIVO':
        return 'Attivo';
      case 'MANUTENZIONE':
        return 'Manutenzione';
      default:
        return status;
    }
  }

  /**
   * Return a PrimeNG severity for a court type tag.
   * @param type - The court type string.
   */
  getTypeSeverity(type: string): 'info' | 'warn' | 'success' {
    switch (type) {
      case 'TENNIS':
        return 'info';
      case 'PADEL':
        return 'success';
      default:
        return 'info';
    }
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

  /** Load all courts from the API. */
  private loadCourts(): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    this.subscription = this.courtService.getAllCourts().subscribe({
      next: (courts) => {
        this.courts = courts.sort((a, b) => a.displayOrder - b.displayOrder);
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare i campi.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Delete a court via the API. */
  private deleteCourt(court: Court): void {
    this.courtService.deleteCourt(court.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminato',
          detail: `Il campo "${court.name}" e stato eliminato.`
        });
        this.loadCourts();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: `Impossibile eliminare il campo "${court.name}".`
        });
      }
    });
  }

  /** Update the display order of a court via the API, then reload. */
  private updateOrder(court: Court, newOrder: number): void {
    this.courtService.updateDisplayOrder(court.id, newOrder).subscribe({
      next: () => {
        this.loadCourts();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile aggiornare l\'ordine di visualizzazione.'
        });
      }
    });
  }

  /** Filter courts by the selected status. */
  private applyFilter(): void {
    if (this.selectedStatus === 'TUTTI') {
      this.filteredCourts = [...this.courts];
    } else {
      this.filteredCourts = this.courts.filter(c => c.status === this.selectedStatus);
    }
  }
}
