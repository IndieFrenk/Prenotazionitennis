import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { CourtService } from '@app/core/services/court.service';
import { AuthService } from '@app/core/services/auth.service';
import { Court } from '@app/core/models/court.model';

/** Options for the court type filter. */
interface FilterOption {
  label: string;
  value: string;
}

/**
 * Booking page - court selection.
 * Displays active courts as cards focused on the booking flow.
 * The user picks a court and is navigated to the court booking calendar.
 */
@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectButtonModule,
    TagModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingComponent implements OnInit {
  private readonly courtService = inject(CourtService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** All courts loaded from the server. */
  courts: Court[] = [];

  /** Courts filtered by the currently selected type. */
  filteredCourts: Court[] = [];

  /** Whether the court list is loading. */
  loading = true;

  /** The currently selected filter type value. */
  selectedType = 'ALL';

  /** Whether the current user has the member role (for price display). */
  isMember = false;

  /** Available filter options for the SelectButton. */
  readonly filterOptions: FilterOption[] = [
    { label: 'Tutti', value: 'ALL' },
    { label: 'Tennis', value: 'TENNIS' },
    { label: 'Padel', value: 'PADEL' }
  ];

  ngOnInit(): void {
    this.isMember = this.authService.hasRole('ROLE_MEMBER');
    this.loadCourts();
  }

  /** Handle filter selection change to update the displayed court list. */
  onFilterChange(): void {
    this.applyFilter();
  }

  /** Navigate to the court booking calendar page. */
  selectCourt(court: Court): void {
    this.router.navigate(['/prenotazioni/campo', court.id]);
  }

  /** Determine the PrimeNG Tag severity based on court type. */
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

  /** Format the opening hours string for display. */
  formatHours(court: Court): string {
    return `${court.openingTime} - ${court.closingTime}`;
  }

  /** Get the display price based on user role. */
  getDisplayPrice(court: Court): number {
    return this.isMember ? court.memberPrice : court.basePrice;
  }

  /** Get the price label based on user role. */
  getPriceLabel(): string {
    return this.isMember ? 'Tariffa socio' : 'Tariffa standard';
  }

  /** Fetch all active courts from the server. */
  private loadCourts(): void {
    this.loading = true;
    this.courtService.getActiveCourts().subscribe({
      next: (courts) => {
        this.courts = courts;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /** Filter the court list based on the selected type. */
  private applyFilter(): void {
    if (this.selectedType === 'ALL') {
      this.filteredCourts = [...this.courts];
    } else {
      this.filteredCourts = this.courts.filter(
        c => c.type.toUpperCase() === this.selectedType
      );
    }
  }
}
