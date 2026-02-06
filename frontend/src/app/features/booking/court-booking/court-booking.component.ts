import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { CourtService } from '@app/core/services/court.service';
import { ReservationService } from '@app/core/services/reservation.service';
import { AuthService } from '@app/core/services/auth.service';
import { Court } from '@app/core/models/court.model';
import { DaySchedule, TimeSlot, ReservationRequest } from '@app/core/models/reservation.model';

/**
 * Court booking calendar component.
 * Displays the day schedule for a selected court with interactive time slots.
 * Allows the user to pick a slot and confirm a reservation through an inline dialog.
 */
@Component({
  selector: 'app-court-booking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    CalendarModule,
    DialogModule,
    TagModule,
    Textarea,
    TooltipModule,
    ProgressSpinnerModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './court-booking.component.html',
  styleUrls: ['./court-booking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourtBookingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly courtService = inject(CourtService);
  private readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** The court being booked. */
  court: Court | null = null;

  /** The current day schedule with time slots. */
  daySchedule: DaySchedule | null = null;

  /** Whether the court info is loading. */
  loadingCourt = true;

  /** Whether the day schedule is loading. */
  loadingSchedule = true;

  /** Whether a reservation submission is in progress. */
  submitting = false;

  /** The currently selected date as a Date object (bound to PrimeNG Calendar). */
  selectedDate: Date = new Date();

  /** Minimum selectable date (today). */
  minDate: Date = new Date();

  /** Maximum selectable date (30 days from now). */
  maxDate: Date = this.computeMaxDate();

  /** Whether the booking confirmation dialog is visible. */
  dialogVisible = false;

  /** The time slot currently selected for booking. */
  selectedSlot: TimeSlot | null = null;

  /** Booking form with optional notes field. */
  bookingForm!: FormGroup;

  /** Whether the current user is a member (affects displayed price). */
  isMember = false;

  /** The court ID extracted from the route. */
  private courtId = '';

  ngOnInit(): void {
    this.isMember = this.authService.hasRole('ROLE_MEMBER');
    this.initForm();

    // Extract courtId from route params
    this.route.paramMap.subscribe(params => {
      const id = params.get('courtId');
      if (id) {
        this.courtId = id;
        this.loadCourt();
        this.loadSchedule();
      } else {
        this.router.navigate(['/prenotazioni']);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Date navigation
  // ---------------------------------------------------------------------------

  /** Navigate to the previous day. Prevents going before today. */
  prevDay(): void {
    const prev = new Date(this.selectedDate);
    prev.setDate(prev.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (prev >= today) {
      this.selectedDate = prev;
      this.loadSchedule();
    }
  }

  /** Navigate to the next day. Prevents going beyond maxDate. */
  nextDay(): void {
    const next = new Date(this.selectedDate);
    next.setDate(next.getDate() + 1);
    if (next <= this.maxDate) {
      this.selectedDate = next;
      this.loadSchedule();
    }
  }

  /** Handle date selection from the PrimeNG Calendar picker. */
  onDateSelect(): void {
    this.loadSchedule();
  }

  /** Check if the previous day button should be disabled (already at today). */
  isPrevDisabled(): boolean {
    const prev = new Date(this.selectedDate);
    prev.setDate(prev.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prev < today;
  }

  /** Check if the next day button should be disabled (already at maxDate). */
  isNextDisabled(): boolean {
    const next = new Date(this.selectedDate);
    next.setDate(next.getDate() + 1);
    return next > this.maxDate;
  }

  // ---------------------------------------------------------------------------
  // Time slot rendering
  // ---------------------------------------------------------------------------

  /**
   * Check if a time slot is in the past (only relevant for today).
   * Compares the slot's start time against the current time.
   */
  isSlotPast(slot: TimeSlot): boolean {
    const today = new Date();
    if (!this.isToday()) {
      return false;
    }
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotTime = new Date(today);
    slotTime.setHours(hours, minutes, 0, 0);
    return slotTime <= today;
  }

  /** Check if the selected date is today. */
  isToday(): boolean {
    const today = new Date();
    return (
      this.selectedDate.getDate() === today.getDate() &&
      this.selectedDate.getMonth() === today.getMonth() &&
      this.selectedDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Determine the CSS class for a time slot based on its state.
   * Available -> green/clickable; Occupied -> gray; Past -> dimmed.
   */
  getSlotClass(slot: TimeSlot): string {
    if (this.isSlotPast(slot)) {
      return 'slot slot-past';
    }
    if (!slot.available) {
      return 'slot slot-occupied';
    }
    return 'slot slot-available';
  }

  /** Get the display label for a time slot. */
  getSlotLabel(slot: TimeSlot): string {
    return `${slot.startTime} - ${slot.endTime}`;
  }

  /** Get the status text shown inside an unavailable slot. */
  getSlotStatus(slot: TimeSlot): string {
    if (this.isSlotPast(slot)) {
      return 'Passato';
    }
    if (!slot.available) {
      return 'Occupato';
    }
    return 'Disponibile';
  }

  // ---------------------------------------------------------------------------
  // Booking dialog
  // ---------------------------------------------------------------------------

  /** Open the booking dialog for the selected time slot. */
  openBookingDialog(slot: TimeSlot): void {
    // Prevent booking past or occupied slots
    if (!slot.available || this.isSlotPast(slot)) {
      return;
    }
    this.selectedSlot = slot;
    this.bookingForm.reset();
    this.dialogVisible = true;
  }

  /** Close the booking dialog without submitting. */
  closeDialog(): void {
    this.dialogVisible = false;
    this.selectedSlot = null;
  }

  /** Get the price to display in the booking dialog. */
  getBookingPrice(): number {
    if (!this.court) {
      return 0;
    }
    return this.isMember ? this.court.memberPrice : this.court.basePrice;
  }

  /** Get the formatted selected date string for display. */
  getFormattedDate(): string {
    return this.formatDateDisplay(this.selectedDate);
  }

  /**
   * Submit the reservation.
   * Calls ReservationService.createReservation() and handles the response.
   */
  confirmBooking(): void {
    if (!this.court || !this.selectedSlot) {
      return;
    }

    this.submitting = true;

    const request: ReservationRequest = {
      courtId: this.court.id,
      reservationDate: this.formatDateApi(this.selectedDate),
      startTime: this.selectedSlot.startTime,
      endTime: this.selectedSlot.endTime,
      notes: this.bookingForm.get('notes')?.value || undefined
    };

    this.reservationService.createReservation(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confermata',
          detail: 'Prenotazione confermata!'
        });
        this.submitting = false;
        this.dialogVisible = false;
        this.selectedSlot = null;
        // Refresh the schedule to reflect the new booking
        this.loadSchedule();
      },
      error: (err) => {
        const detail = err?.error?.message || 'Impossibile completare la prenotazione. Riprova.';
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail
        });
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Navigate back to the court selection page. */
  goBack(): void {
    this.router.navigate(['/prenotazioni']);
  }

  /** Get the PrimeNG Tag severity for the court type. */
  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (type?.toUpperCase()) {
      case 'TENNIS':
        return 'success';
      case 'PADEL':
        return 'info';
      default:
        return 'secondary';
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Initialize the booking form with the optional notes field. */
  private initForm(): void {
    this.bookingForm = this.fb.group({
      notes: ['']
    });
  }

  /** Load the court information by ID. */
  private loadCourt(): void {
    this.loadingCourt = true;
    this.courtService.getCourtById(this.courtId).subscribe({
      next: (court) => {
        this.court = court;
        this.loadingCourt = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingCourt = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare le informazioni del campo.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  /** Load the day schedule for the current court and selected date. */
  private loadSchedule(): void {
    this.loadingSchedule = true;
    this.cdr.markForCheck();

    const dateStr = this.formatDateApi(this.selectedDate);
    this.courtService.getDaySchedule(this.courtId, dateStr).subscribe({
      next: (schedule) => {
        this.daySchedule = schedule;
        this.loadingSchedule = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.daySchedule = null;
        this.loadingSchedule = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare gli orari disponibili.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  /** Format a Date to yyyy-MM-dd for API calls. */
  private formatDateApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Format a Date to a human-readable Italian-style string. */
  private formatDateDisplay(date: Date): string {
    const dayNames = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName} ${dayNum} ${monthName} ${year}`;
  }

  /** Compute the maximum bookable date (30 days from today). */
  private computeMaxDate(): Date {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    return max;
  }
}
