import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { LoginPage } from './login-page';

const USER = {
  id: 'user-1',
  email: 'alice@worknest.test',
  displayName: 'Alice',
  createdAt: '2026-11-02T10:00:00.000Z',
};

describe('LoginPage', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function createPage() {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture;
  }

  function fill(fixture: ReturnType<typeof createPage>, email: string, password: string): void {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    inputs[0]!.value = email;
    inputs[0]!.dispatchEvent(new Event('input'));
    inputs[1]!.value = password;
    inputs[1]!.dispatchEvent(new Event('input'));

    fixture.detectChanges();
  }

  function submit(fixture: ReturnType<typeof createPage>): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('renders the form with accessible labels', () => {
    const fixture = createPage();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Sign in to WorkNest');
    expect(text).toContain('Email');
    expect(text).toContain('Password');
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(2);
  });

  it('shows validation messages and does not call the API for an empty form', () => {
    const fixture = createPage();

    submit(fixture);

    expect(fixture.nativeElement.textContent).toContain('Enter your email address.');
    expect(fixture.nativeElement.textContent).toContain('Enter your password.');
    httpMock.expectNone('/api/auth/login');
  });

  it('rejects a malformed email before sending it', () => {
    const fixture = createPage();

    fill(fixture, 'not-an-email', 'secret');
    submit(fixture);

    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');
    httpMock.expectNone('/api/auth/login');
  });

  it('posts trimmed credentials, disables the button, then navigates on success', async () => {
    const fixture = createPage();

    fill(fixture, '  alice@worknest.test  ', 'secret');
    submit(fixture);

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({
      email: 'alice@worknest.test',
      password: 'secret',
    });

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Signing in');

    request.flush({ data: { user: USER } });
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows the generic credentials message on 401', async () => {
    const fixture = createPage();

    fill(fixture, 'alice@worknest.test', 'wrong');
    submit(fixture);

    httpMock
      .expectOne('/api/auth/login')
      .flush(
        { error: { code: 'INVALID_CREDENTIALS' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Email or password is incorrect.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('explains rate limiting separately', async () => {
    const fixture = createPage();

    fill(fixture, 'alice@worknest.test', 'wrong');
    submit(fixture);

    httpMock
      .expectOne('/api/auth/login')
      .flush({ error: { code: 'RATE_LIMITED' } }, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Too many sign-in attempts');
  });

  it('explains an unreachable API', async () => {
    const fixture = createPage();

    fill(fixture, 'alice@worknest.test', 'secret');
    submit(fixture);

    httpMock.expectOne('/api/auth/login').error(new ProgressEvent('error'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cannot reach the API');
  });
});
