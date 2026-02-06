import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { GalleriaModule } from 'primeng/galleria';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { CourtService } from '@app/core/services/court.service';
import { AuthService } from '@app/core/services/auth.service';
import { Court, CourtPhoto } from '@app/core/models/court.model';

/**
 * Court detail page.
 * Displays full information for a single court including photo gallery,
 * description, prices, and opening hours.
 */
@Component({
  selector: 'app-court-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    GalleriaModule,
    TableModule,
    DividerModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './court-detail.component.html',
  styleUrls: ['./court-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourtDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courtService = inject(CourtService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** The loaded court object. */
  court: Court | null = null;

  /** Photos sorted by display order for the gallery. */
  sortedPhotos: CourtPhoto[] = [];

  /** Whether the court is currently loading. */
  loading = true;

  /** Error message if the court fails to load. */
  errorMessage: string | null = null;

  /** Galleria responsive options for different screen sizes. */
  readonly galleriaResponsiveOptions = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 1 }
  ];

  /** Price table rows for display. */
  priceRows: Array<{ label: string; value: string }> = [];

  /** Stock image URL when no photos are available. */
  stockImageUrl: string = 'assets/images/court-placeholder.jpg';

  ngOnInit(): void {
    const courtId = this.route.snapshot.paramMap.get('id');
    if (courtId) {
      this.loadCourt(courtId);
    } else {
      this.errorMessage = 'ID campo non valido.';
      this.loading = false;
    }
  }

  /**
   * Navigate to the booking page for this court.
   * Redirects to login if the user is not authenticated.
   */
  bookCourt(): void {
    if (!this.court) {
      return;
    }
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/prenotazioni/campo', this.court.id]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/prenotazioni/campo/${this.court.id}` }
      });
    }
  }

  /** Navigate back to the court list. */
  goBack(): void {
    this.router.navigate(['/campi']);
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

  /** Fetch the court details from the server. */
  private loadCourt(id: string): void {
    this.loading = true;
    this.courtService.getCourtById(id).subscribe({
      next: (court) => {
        this.court = court;
        this.sortedPhotos = court.photos
          ? [...court.photos].sort((a, b) => a.displayOrder - b.displayOrder)
          : [];
        this.setStockImage(court);
        this.buildPriceTable(court);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossibile caricare i dettagli del campo.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Set the appropriate stock image based on court type. */
  private setStockImage(court: Court): void {
    if (court.type?.toUpperCase() === 'PADEL') {
      this.stockImageUrl = 'assets/images/padel-court.jpg';
    } else if (court.type?.toUpperCase() === 'TENNIS') {
      this.stockImageUrl = 'assets/images/tennis-court.jpg';
    } else {
      this.stockImageUrl = 'assets/images/court-placeholder.jpg';
    }
  }

  /** Build the price table rows from court data. */
  private buildPriceTable(court: Court): void {
    this.priceRows = [
      {
        label: 'Tariffa standard',
        value: `\u20AC ${court.basePrice.toFixed(2)} / ora`
      },
      {
        label: 'Tariffa soci',
        value: `\u20AC ${court.memberPrice.toFixed(2)} / ora`
      }
    ];
  }
}
