import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, type Observable, of, shareReplay, tap } from 'rxjs';

/**
 * The user shape returned by the authentication API.
 *
 * Mirrors `PublicUser` on the backend. The frontend never sees `passwordHash` or
 * the session token; the cookie is `HttpOnly`, so this is all the UI can know.
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * `unknown` means "we have not asked the API yet". Keeping it distinct from
 * `anonymous` is what stops the login form flashing for a returning user while
 * `GET /api/auth/me` is still in flight.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthResponse {
  data: { user: AuthUser };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly userState = signal<AuthUser | null>(null);
  private readonly statusState = signal<AuthStatus>('unknown');
  private sessionRequest: Observable<AuthUser | null> | null = null;

  readonly user = this.userState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly isAuthenticated = computed(() => this.statusState() === 'authenticated');

  /**
   * Asks the API who the cookie belongs to.
   *
   * Any failure is treated as "not signed in". A startup network error should
   * still render the login page so the user can see and retry the problem,
   * rather than abort application bootstrap.
   */
  loadSession(): Observable<AuthUser | null> {
    const inFlight = this.sessionRequest;
    if (inFlight) {
      return inFlight;
    }

    if (this.statusState() !== 'unknown') {
      return of(this.userState());
    }

    const request = this.http.get<AuthResponse>('/api/auth/me').pipe(
      map((response) => response.data.user),
      tap((user) => this.setAuthenticated(user)),
      catchError(() => {
        this.setAnonymous();
        return of(null);
      }),
      finalize(() => {
        this.sessionRequest = null;
      }),
      // The app initializer and a guard may ask at the same time. Sharing the
      // response means one request, and a late subscriber still gets the result.
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.sessionRequest = request;
    return request;
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      map((response) => response.data.user),
      tap((user) => this.setAuthenticated(user)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(tap(() => this.setAnonymous()));
  }

  private setAuthenticated(user: AuthUser): void {
    this.userState.set(user);
    this.statusState.set('authenticated');
  }

  private setAnonymous(): void {
    this.userState.set(null);
    this.statusState.set('anonymous');
  }
}
