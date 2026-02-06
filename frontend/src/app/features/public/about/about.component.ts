import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { PageService } from '@app/core/services/page.service';
import { SitePage } from '@app/core/models/page.model';

/**
 * About / "Chi siamo" page.
 * Loads the CMS page with slug 'about' and renders its HTML content.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
  private readonly pageService = inject(PageService);

  /** CMS page content loaded from the server. */
  page: SitePage | null = null;

  /** Whether the page content is currently loading. */
  loading = true;

  /** Error message if the page fails to load. */
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadPage();
  }

  /** Fetch the about page content from the CMS. */
  private loadPage(): void {
    this.loading = true;
    this.pageService.getPage('about').subscribe({
      next: (page) => {
        this.page = page;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossibile caricare il contenuto della pagina.';
        this.loading = false;
      }
    });
  }
}
