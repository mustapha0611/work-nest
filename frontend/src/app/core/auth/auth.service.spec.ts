import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, type AuthUser } from './auth.service';

const USER: AuthUser = {
  id: 'user-1',
  email: 'alice@worknest.test',
  displayName: 'Alice',
  createdAt: '2026-11-02T10:00:00.000Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts in the unknown state', () => {
    expect(service.status()).toBe('unknown');
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('loads the signed-in user from /api/auth/me', async () => {
    const session = firstValueFrom(service.loadSession());

    httpMock.expectOne('/api/auth/me').flush({ data: { user: USER } });

    await expect(session).resolves.toEqual(USER);
    expect(service.status()).toBe('authenticated');
    expect(service.user()).toEqual(USER);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('treats a rejected /me as an anonymous session', async () => {
    const session = firstValueFrom(service.loadSession());

    httpMock
      .expectOne('/api/auth/me')
      .flush(
        { error: { code: 'UNAUTHENTICATED', message: 'Sign in.' } },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expect(session).resolves.toBeNull();
    expect(service.status()).toBe('anonymous');
    expect(service.user()).toBeNull();
  });

  it('treats an unreachable API as anonymous instead of failing bootstrap', async () => {
    const session = firstValueFrom(service.loadSession());

    httpMock.expectOne('/api/auth/me').error(new ProgressEvent('error'));

    await expect(session).resolves.toBeNull();
    expect(service.status()).toBe('anonymous');
  });

  it('caches a resolved session instead of asking again', async () => {
    const first = firstValueFrom(service.loadSession());
    httpMock.expectOne('/api/auth/me').flush({ data: { user: USER } });
    await first;

    const second = await firstValueFrom(service.loadSession());

    expect(second).toEqual(USER);
    httpMock.expectNone('/api/auth/me');
  });

  it('logs in, stores the user and exposes an authenticated status', async () => {
    const login = firstValueFrom(
      service.login({ email: 'alice@worknest.test', password: 'secret' }),
    );

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'alice@worknest.test',
      password: 'secret',
    });
    request.flush({ data: { user: USER } });

    await expect(login).resolves.toEqual(USER);
    expect(service.status()).toBe('authenticated');
    expect(service.user()).toEqual(USER);
  });

  it('clears the user after a successful logout', async () => {
    const login = firstValueFrom(
      service.login({ email: 'alice@worknest.test', password: 'secret' }),
    );
    httpMock.expectOne('/api/auth/login').flush({ data: { user: USER } });
    await login;

    const logout = firstValueFrom(service.logout());
    httpMock.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await logout;

    expect(service.status()).toBe('anonymous');
    expect(service.user()).toBeNull();
  });
});
