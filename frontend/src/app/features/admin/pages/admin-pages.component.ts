import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { PageService } from '@app/core/services/page.service';
import { SitePage } from '@app/core/models/page.model';

/**
 * Admin pages list component.
 * Displays all CMS pages in a DataTable with navigation to the edit page.
 * Pages are fixed (home, about, contatti) so no create/delete actions are shown.
 */
@Component({
  selector: 'app-admin-pages',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './admin-pages.component.html',
  styleUrls: ['./admin-pages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPagesComponent implements OnInit, OnDestroy {
  private readonly pageService = inject(PageService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;

  /** All site pages loaded from the API. */
  pages: SitePage[] = [];

  /** Whether pages are being loaded. */
  loading = false;

  ngOnInit(): void {
    this.loadPages();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Navigate to the page edit view for the given page.
   * @param page - The page to edit.
   */
  editPage(page: SitePage): void {
    void this.router.navigate(['/admin/pagine', page.slug]);
  }

  /**
   * Format an ISO date string to Italian locale format (dd/MM/yyyy HH:mm).
   * @param dateStr - ISO 8601 date string.
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Load all pages from the API. */
  private loadPages(): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    this.subscription = this.pageService.getAllPages().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare le pagine.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
