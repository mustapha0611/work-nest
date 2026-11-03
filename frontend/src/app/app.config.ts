import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    /**
     * Resolve the session before the first navigation.
     *
     * The guards are synchronous, which is only safe if `AuthService.status()`
     * is already `authenticated` or `anonymous` when routing starts. Waiting
     * here also avoids rendering the login form for a user who is signed in.
     */
    provideAppInitializer(() => firstValueFrom(inject(AuthService).loadSession())),
  ],
};
