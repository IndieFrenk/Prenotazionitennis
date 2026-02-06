import { Component } from '@angular/core';

/**
 * Simple application footer displaying copyright and club name.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  /** Current year for the copyright notice. */
  readonly currentYear = new Date().getFullYear();
}
