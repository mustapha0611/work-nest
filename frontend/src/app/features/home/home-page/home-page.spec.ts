import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { vi } from 'vitest';
import { AuthService, type AuthUser } from '../../../core/auth/auth.service';
import { HomePage } from './home-page';

const USER: AuthUser = {
  id: 'user-1',
  email: 'alice@worknest.test',
  displayName: 'Alice',
  createdAt: '2026-11-02T10:00:00.000Z',
};

describe('HomePage', () => {
  let logoutResult: Observable<void>;
  let logout: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    logoutResult = of(undefined);
    logout = vi.fn(() => logoutResult);

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: () => USER,
            logout,
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createPage() {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the signed-in user', () => {
    const fixture = createPage();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Signed in');
    expect(text).toContain('Alice');
    expect(text).toContain('alice@worknest.test');
  });

  it('signs out and returns to the login page', async () => {
    const fixture = createPage();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    await fixture.whenStable();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('keeps the user signed in and explains a failed logout', () => {
    logoutResult = throwError(() => new Error('network'));
    const fixture = createPage();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not sign out');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
