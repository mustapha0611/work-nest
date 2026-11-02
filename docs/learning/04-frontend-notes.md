# 04 — Frontend notes: zoneless, signals, and API boundaries

Most of this will feel familiar. Two parts will not: **zoneless change detection** and the reason the
service, not the component, owns the wire format.

## Zoneless changes the rules

The app was scaffolded with `--zoneless`, so there is no `zone.js` patching `setTimeout` and XHR to
trigger change detection.

The consequence, and the most important frontend lesson of M1:

> Updating a plain class field inside an async callback does **not** re-render the view.

```ts
// Does NOT reliably update the template in a zoneless app
private health?: ApiHealth;

load(): void {
  this.healthService.getHealth().subscribe((health) => {
    this.health = health;
  });
}
```

Signals are the notification mechanism:

```ts
this.state.set({ status: 'ready', health });
```

`set` notifies the scheduler, which marks the component dirty. `computed` derives from it. No
`ChangeDetectorRef`, no `markForCheck`, no `NgZone`.

If you remember one rule: **in zoneless Angular, async work must write to a signal** (or explicitly
mark the view).

## A state machine instead of three booleans

```ts
type HealthState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly health: ApiHealth }
  | { readonly status: 'failed'; readonly message: string };
```

Illegal states are unrepresentable: you cannot have `status: 'ready'` without `health`. Compare the
common alternative:

```ts
loading = false;
error: string | null = null;
health: ApiHealth | null = null;
```

That version allows `loading: true` **and** `error` at the same time, and every consumer has to guess
which one wins. It also makes "render one of three things" a chain of conditions rather than a switch
on one value.

`computed` projects the union into template-friendly values:

```ts
protected readonly isLoading = computed(() => this.state().status === 'loading');
protected readonly health = computed(() => {
  const state = this.state();
  return state.status === 'ready' ? state.health : null;
});
protected readonly failureMessage = computed(() => {
  const state = this.state();
  return state.status === 'failed' ? state.message : null;
});
```

This keeps the template declarative and avoids relying on narrowing inside deeply nested blocks.

## `@if` aliasing

```html
@if (health(); as health) {
<dd>{{ health.uptimeSeconds }} s</dd>
}
```

The alias narrows the type and avoids calling `health()` repeatedly. It is the modern equivalent of
`*ngIf="value as alias"`.

## Accessibility details that cost almost nothing

- `aria-live="polite"` on the panel announces the status after the async request resolves.
- The retry button is `[disabled]="isLoading()"`, which prevents double submissions without another
  flag.
- `:focus-visible` styling keeps keyboard users oriented.
- The status is expressed in text ("API online"), not colour alone.

## The service owns the wire format

```ts
interface HealthResponse { data: { status: string; ... } }  // private
export interface ApiHealth { status: string; ... }          // public

getHealth(): Observable<ApiHealth> {
  return this.http.get<HealthResponse>('/api/health')
    .pipe(map((response) => response.data));
}
```

- The component never sees `{ data: ... }`.
- If the envelope changes, exactly one file changes.
- `HealthResponse` is deliberately not exported; that is an encapsulation boundary.

This is the same instinct as keeping helper functions module-private, applied to API contracts.

## Authentication is app state, not a page

The login screen is a feature, but "who is signed in" belongs to the whole application. That is why
`core/auth/auth.service.ts` owns it:

```ts
private readonly statusState = signal<AuthStatus>('unknown');
readonly isAuthenticated = computed(() => this.statusState() === 'authenticated');
```

`unknown` is a real state, not a null. It means "the startup check has not answered yet". Keeping it
distinct from `anonymous` is what stops a signed-in user seeing the login form flash while
`GET /api/auth/me` is in flight.

The startup check is an application initializer:

```ts
provideAppInitializer(() => firstValueFrom(inject(AuthService).loadSession()));
```

Angular waits for that observable before the first navigation, which lets the guards be synchronous:

```ts
return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
```

Two rules fall out of the cookie design:

- The browser cannot read the token, because the cookie is `HttpOnly`. `/me` is how the UI learns who
  the user is; there is no "current user" object in JavaScript storage.
- The client never decides whether a request is allowed. Hiding a route or a button is navigation
  convenience; the API still checks the session on every request.

Login errors are mapped from status and stable codes, not from server prose:

```ts
if (error.status === 429) return 'Too many sign-in attempts. …';
if (error.status === 401) return 'Email or password is incorrect.';
```

The 401 message is intentionally identical for an unknown email, a wrong password and a deactivated
account, matching the API. A more helpful client message would undo the server's anti-enumeration
work.

## Subscriptions and lifecycle

```ts
this.healthService.getHealth().subscribe({ next, error });
```

No `unsubscribe` because `HttpClient` observables **complete** after one emission. This is a genuine
exception to "always unsubscribe". Streams that never complete — router params, websockets, form
value changes — should use `takeUntilDestroyed()`.

`HttpErrorResponse.status === 0` is not an HTTP status. It means no response reached the client:
network down, DNS failure, or a CORS block. A `500` is a completely different situation. The component
maps the two to different messages, which is why the template can say "unreachable" versus
"unexpected error".

## How the component is tested

`HttpTestingController` intercepts `HttpClient` before the network:

```ts
const request = httpMock.expectOne('/api/health');
request.flush({ data: { status: 'ok', ... } });
```

- `expectOne(url)` proves the request URL is what we think it is.
- `flush(...)` supplies a response with no server running.
- `verify()` in `afterEach` fails the test if a request was made and never asserted — this is how
  forgotten HTTP calls are caught.

The tests cover four behaviours: loading state, success state, unreachable API, and server error
without leaking the server's message.

`await fixture.whenStable()` is what lets the signal updates flush before assertions; `detectChanges()`
then renders.

## What a frontend developer should unlearn

| Habit                                          | Backend/full-stack reality                                    |
| ---------------------------------------------- | ------------------------------------------------------------- |
| "The client validates, so it is valid"         | The client is untrusted; validate again on the server         |
| "I hide the button, so they cannot do it"      | Authorization is a server check, never a UI decision          |
| "The response shape is whatever the type says" | Types are erased at runtime; the server can change            |
| "Errors are a UI concern"                      | Errors are a contract, with stable codes and statuses         |
| "Fast locally means fast in production"        | Latency, concurrency, and payload size are different problems |

## Deliberate gaps

| Gap                                | Reason                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| No protected product routes yet    | Authentication guards exist; workspace/project routes arrive with M5                   |
| No global HTTP error interceptor   | Error mapping is still local to auth; add an interceptor when it repeats               |
| No optimistic UI                   | Nothing is written yet                                                                 |
| No `resource()` / `httpResource()` | Explicit signals are easier to reason about first; revisit once there are more screens |

## Related

- Error contract: [02-backend-runtime.md](02-backend-runtime.md)
- Tooling and trade-offs: [05-tooling-and-decisions.md](05-tooling-and-decisions.md)
