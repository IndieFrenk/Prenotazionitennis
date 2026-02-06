import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
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
 * Court listing page.
 * Displays all active courts in a responsive grid with type filtering.
 * Each court card shows key information and navigation buttons.
 */
@Component({
  selector: 'app-court-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    BadgeModule,
    SelectButtonModule,
    TagModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './court-list.component.html',
  styleUrls: ['./court-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourtListComponent implements OnInit {
  private readonly courtService = inject(CourtService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  /** All courts loaded from the server. */
  courts: Court[] = [];

  /** Courts filtered by the currently selected type. */
  filteredCourts: Court[] = [];

  /** Whether the court list is loading. */
  loading = true;

  /** The currently selected filter type value. */
  selectedType = 'ALL';

  /** Available filter options for the SelectButton. */
  readonly filterOptions: FilterOption[] = [
    { label: 'Tutti', value: 'ALL' },
    { label: 'Tennis', value: 'TENNIS' },
    { label: 'Padel', value: 'PADEL' }
  ];

  ngOnInit(): void {
    this.loadCourts();
  }

  /** Handle filter selection change to update the displayed court list. */
  onFilterChange(): void {
    this.applyFilter();
  }

  /** Navigate to the court detail page. */
  viewDetails(court: Court): void {
    this.router.navigate(['/campi', court.id]);
  }

  /**
   * Navigate to the booking page for a court.
   * Redirects to login if the user is not authenticated.
   */
  bookCourt(court: Court): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/prenotazioni/campo', court.id]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/prenotazioni/campo/${court.id}` }
      });
    }
  }

  /**
   * Get the first photo URL for a court, or a stock image based on court type.
   */
  getCourtImage(court: Court): string {
    if (court.photos && court.photos.length > 0) {
      // Sort by displayOrder and return the first
      const sorted = [...court.photos].sort((a, b) => a.displayOrder - b.displayOrder);
      return sorted[0].imageUrl;
    }
    // Return type-specific stock image
    if (court.type?.toUpperCase() === 'PADEL') {
      return 'assets/images/padel-court.jpg';
    }
    if (court.type?.toUpperCase() === 'TENNIS') {
      return 'assets/images/tennis-court.jpg';
    }
    return 'assets/images/court-placeholder.jpg';
  }

  /**
   * Get the alt text for the court image.
   */
  getCourtImageAlt(court: Court): string {
    if (court.photos && court.photos.length > 0) {
      const sorted = [...court.photos].sort((a, b) => a.displayOrder - b.displayOrder);
      return sorted[0].altText || court.name;
    }
    return court.name;
  }

  /**
   * Get a truncated description for the card preview.
   */
  getExcerpt(description: string, maxLength = 120): string {
    if (!description) {
      return '';
    }
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength).trimEnd() + '...';
  }

  /**
   * Determine the PrimeNG Tag severity based on court type.
   */
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

  /** Fetch all active courts from the server. */
  private loadCourts(): void {
    this.loading = true;
    this.courtService.getActiveCourts().subscribe({
      next: (courts) => {
        this.courts = courts;
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
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
