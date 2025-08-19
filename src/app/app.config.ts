import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { LocationStrategy, HashLocationStrategy } from '@angular/common'; // ✅ Correct import
import { ToastrModule } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy, // ✅ Correct usage
    },
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
     provideAnimations(), // 👈 مهم جداً للـ ngx-toastr
    importProvidersFrom(ToastrModule.forRoot()) 
  ],
};