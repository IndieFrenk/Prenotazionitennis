import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DashboardService } from '@app/core/services/dashboard.service';
import { DashboardStats, CourtUsageStat } from '@app/core/models/common.model';

/**
 * Admin dashboard overview component.
 * Displays aggregated statistics (reservations, revenue) and court usage
 * via summary cards, a data table, and a bar chart.
 * Supports date-range filtering with quick-select buttons.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    CalendarModule,
    ChartModule,
    ProgressSpinnerModule,
    TagModule,
    CurrencyPipe
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private statsSubscription: Subscription | null = null;

  /** Dashboard statistics loaded from the API. */
  stats: DashboardStats | null = null;

  /** Whether stats are currently being fetched. */
  loading = false;

  /** Date range selected via the calendar picker: [fromDate, toDate]. */
  dateRange: Date[] | null = null;

  /** Maximum selectable date (today). */
  readonly maxDate = new Date();

  /** Active quick-filter key for highlighting the selected button. */
  activeFilter: 'today' | 'week' | 'month' | 'year' | 'custom' = 'month';

  /** Chart.js data object for the court usage bar chart. */
  chartData: unknown = {};

  /** Chart.js configuration options. */
  chartOptions: unknown = {};

  ngOnInit(): void {
    this.initChartOptions();
    this.applyFilter('month');
  }

  ngOnDestroy(): void {
    this.statsSubscription?.unsubscribe();
  }

  /**
   * Apply a quick date-range filter and reload stats.
   * @param filter - The preset filter to apply.
   */
  applyFilter(filter: 'today' | 'week' | 'month' | 'year'): void {
    this.activeFilter = filter;
    const now = new Date();
    let from: Date;

    switch (filter) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week': {
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start of week
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        break;
      }
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
    }

    this.dateRange = [from, now];
    this.loadStats(from, now);
  }

  /**
   * Handle date range changes from the calendar picker.
   * Only reloads stats when both dates are selected.
   */
  onDateRangeChange(): void {
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      this.activeFilter = 'custom';
      this.loadStats(this.dateRange[0], this.dateRange[1]);
    }
  }

  /**
   * Format a number as Euro currency string.
   * @param value - The numeric amount.
   * @returns Formatted string such as "1.234,56".
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

  /**
   * Load dashboard statistics from the API for the given date range.
   */
  private loadStats(from: Date, to: Date): void {
    this.loading = true;
    this.statsSubscription?.unsubscribe();

    const fromDate = this.formatDate(from);
    const toDate = this.formatDate(to);

    this.statsSubscription = this.dashboardService.getStats(fromDate, toDate).subscribe({
      next: (data) => {
        this.stats = data;
        this.buildChartData(data.courtUsageStats);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Format a Date object as an ISO date string (YYYY-MM-DD).
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Build the Chart.js data structure from court usage stats.
   */
  private buildChartData(courts: CourtUsageStat[]): void {
    const labels = courts.map(c => c.courtName);
    const reservationCounts = courts.map(c => c.reservationCount);
    const revenues = courts.map(c => c.revenue);

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Prenotazioni',
          data: reservationCounts,
          backgroundColor: 'rgba(46, 125, 50, 0.7)',
          borderColor: 'rgba(46, 125, 50, 1)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Ricavo (EUR)',
          data: revenues,
          backgroundColor: 'rgba(25, 118, 210, 0.7)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1'
        }
      ]
    };
  }

  /**
   * Initialize Chart.js options with dual Y axes.
   */
  private initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label.includes('Ricavo')) {
                return `${label}: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)}`;
              }
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Prenotazioni'
          },
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Ricavo (EUR)'
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };
  }
}
