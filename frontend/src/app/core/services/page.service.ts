import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { SitePage, ContactInfo, ContactFormRequest } from '@app/core/models/page.model';

/**
 * Service for CMS page retrieval, contact info, and contact form submission.
 * Implements caching for frequently accessed data.
 */
@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Cache for page data by slug. */
  private pageCache = new Map<string, Observable<SitePage>>();

  /** Cached contact info observable. */
  private contactInfoCache$: Observable<ContactInfo> | null = null;

  // ---------------------------------------------------------------------------
  // Public endpoints
  // ---------------------------------------------------------------------------

  /** Fetch a single CMS page by its slug (cached). */
  getPage(slug: string): Observable<SitePage> {
    if (!this.pageCache.has(slug)) {
      const page$ = this.http.get<SitePage>(`${this.apiUrl}/public/pages/${slug}`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.pageCache.set(slug, page$);
    }
    return this.pageCache.get(slug)!;
  }

  /** Fetch all CMS pages. */
  getAllPages(): Observable<SitePage[]> {
    return this.http.get<SitePage[]>(`${this.apiUrl}/public/pages`);
  }

  /** Fetch the club's contact information (cached). */
  getContactInfo(): Observable<ContactInfo> {
    if (!this.contactInfoCache$) {
      this.contactInfoCache$ = this.http.get<ContactInfo>(`${this.apiUrl}/public/contact`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.contactInfoCache$;
  }

  /** Clear cache (call after admin updates). */
  clearCache(): void {
    this.pageCache.clear();
    this.contactInfoCache$ = null;
  }

  /** Submit the public contact form. */
  sendContactForm(request: ContactFormRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/public/contact/send`, request);
  }

  // ---------------------------------------------------------------------------
  // Admin endpoints
  // ---------------------------------------------------------------------------

  /** Update a CMS page by its slug (admin only). */
  updatePage(slug: string, request: Partial<SitePage>): Observable<SitePage> {
    return this.http.put<SitePage>(`${this.apiUrl}/admin/pages/${slug}`, request);
  }

  /** Update the club's contact information (admin only). */
  updateContactInfo(request: Partial<ContactInfo>): Observable<ContactInfo> {
    return this.http.put<ContactInfo>(`${this.apiUrl}/admin/contact`, request);
  }
}
