import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Bootstrap the standalone root component with application-level providers
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Application bootstrap failed:', err));
