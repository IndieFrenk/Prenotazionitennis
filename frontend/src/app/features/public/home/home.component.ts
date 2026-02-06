import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { PageService } from '@app/core/services/page.service';
import { SitePage } from '@app/core/models/page.model';

/**
 * Public home page component.
 * Loads CMS content for the 'home' slug and displays a hero section
 * with quick-link cards to key areas of the site.
 */
@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    LoadingSpinnerComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicHomeComponent implements OnInit {
  private readonly pageService = inject(PageService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** CMS page content loaded from the server. */
  page: SitePage | null = null;

  /** Whether the page content is currently loading. */
  loading = true;

  /** Error message if the page fails to load. */
  errorMessage: string | null = null;

  /** Quick-link card definitions for the home page. */
  readonly quickLinks = [
    {
      title: 'I nostri campi',
      description: 'Scopri i campi da tennis e padel disponibili presso il nostro circolo.',
      icon: 'pi pi-th-large',
      route: '/campi'
    },
    {
      title: 'Prenota un campo',
      description: 'Prenota il tuo campo preferito in pochi click, scegliendo data e orario.',
      icon: 'pi pi-calendar-plus',
      route: '/prenotazioni'
    },
    {
      title: 'Contattaci',
      description: 'Hai domande? Contattaci per informazioni su corsi, tornei e abbonamenti.',
      icon: 'pi pi-envelope',
      route: '/contatti'
    }
  ];

  ngOnInit(): void {
    this.loadPage();
  }

  /** Fetch the home page content from the CMS. */
  private loadPage(): void {
    this.loading = true;
    this.pageService.getPage('home').subscribe({
      next: (page) => {
        this.page = page;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Impossibile caricare il contenuto della pagina.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
