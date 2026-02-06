import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { PageService } from '@app/core/services/page.service';
import { SitePage } from '@app/core/models/page.model';

/**
 * Admin page edit component.
 * Loads a CMS page by slug from the route and allows editing
 * its title and HTML content through a two-tab interface
 * (edit form + live HTML preview).
 */
@Component({
  selector: 'app-admin-page-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    Textarea,
    ButtonModule,
    CardModule,
    TabViewModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  templateUrl: './admin-page-edit.component.html',
  styleUrls: ['./admin-page-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPageEditComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageService = inject(PageService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;

  /** The slug read from the route params. */
  slug = '';

  /** The loaded page data. */
  page: SitePage | null = null;

  /** Whether the initial data is being loaded. */
  loading = false;

  /** Whether a save operation is in progress. */
  saving = false;

  /** Reactive form for page data. */
  pageForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.slug = slug;
      this.loadPage(slug);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Save the page content by calling the API update endpoint.
   */
  save(): void {
    if (this.pageForm.invalid) {
      this.pageForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Il titolo della pagina e obbligatorio.'
      });
      return;
    }

    this.saving = true;
    const { title, contentHtml } = this.pageForm.value;

    this.pageService.updatePage(this.slug, { title, contentHtml }).subscribe({
      next: (updated) => {
        this.page = updated;
        this.messageService.add({
          severity: 'success',
          summary: 'Salvato',
          detail: 'Pagina aggiornata con successo'
        });
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile aggiornare la pagina.'
        });
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Navigate back to the pages list.
   */
  goBack(): void {
    void this.router.navigate(['/admin/pagine']);
  }

  /**
   * Check whether a form control is invalid and has been touched.
   * @param controlName - The name of the form control.
   */
  isInvalid(controlName: string): boolean {
    const control = this.pageForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  /**
   * Get the current HTML content from the form for the preview tab.
   */
  get previewHtml(): string {
    return this.pageForm.get('contentHtml')?.value ?? '';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Initialize the reactive form with validators. */
  private initForm(): void {
    this.pageForm = this.fb.group({
      title: ['', [Validators.required]],
      contentHtml: ['']
    });
  }

  /** Load a page by slug and patch the form. */
  private loadPage(slug: string): void {
    this.loading = true;
    this.subscription?.unsubscribe();

    this.subscription = this.pageService.getPage(slug).subscribe({
      next: (page) => {
        this.page = page;
        this.pageForm.patchValue({
          title: page.title,
          contentHtml: page.contentHtml
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile caricare i dati della pagina.'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
