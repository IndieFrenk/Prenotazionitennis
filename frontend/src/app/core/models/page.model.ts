/**
 * CMS page and contact-related interfaces.
 */

/** Represents a static content page managed via the CMS. */
export interface SitePage {
  id: string;
  slug: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
}

/** Contact information displayed on the site and used for the map. */
export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  welcomeMessage: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

/** Payload for the public contact form submission. */
export interface ContactFormRequest {
  name: string;
  email: string;
  message: string;
}
