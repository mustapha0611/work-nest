import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('auth guards', () => {
  function setUp(authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => authenticated },
        },
      ],
    });
  }

  it('sends an anonymous user to the login page', () => {
    setUp(false);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('lets an authenticated user through', () => {
    setUp(true);

    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('keeps an authenticated user off the login page', () => {
    setUp(true);

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('shows the login page to an anonymous user', () => {
    setUp(false);

    expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).toBe(true);
  });
});
