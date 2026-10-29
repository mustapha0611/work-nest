# 06 — Exercises and review questions

Do these on a scratch branch so `main` stays clean.

```powershell
git switch -c practice/m1
```

Revert each experiment before starting the next one.

## 1. Make configuration fail loudly

**From `backend/`:**

```powershell
$env:PORT='abc'
npx tsx --env-file=.env src/server.ts
Remove-Item Env:PORT
```

**Expected:**

```text
Invalid environment configuration:
  - PORT: Invalid input: expected number, received NaN
```

Then try the same with `npm run dev -w backend`. Because `tsx watch` keeps the process alive waiting
for file changes, the startup error is printed but the watcher does not exit. Press Ctrl+C.

**What to take away:** an invalid environment produces one readable message and a non-zero exit, not a
mysterious failure later. Shell variables take precedence over `.env`, which is how CI injects values.

## 2. Compare two CORS decisions

```powershell
npm run dev -w backend
```

In a second terminal:

```powershell
curl.exe -i http://localhost:3000/api/health -H "Origin: http://localhost:4200"
curl.exe -i http://localhost:3000/api/health -H "Origin: http://evil.example"
```

The first includes `Access-Control-Allow-Origin: http://localhost:4200`. The second does not, yet still
returns `200`.

**Why 200?** The server processed the request. The browser, not the server, prevents JavaScript on
`evil.example` from reading the response. CORS is a read permission for browsers, not access control.

## 3. Break the middleware order

In `backend/src/app.ts`, move `app.use(notFoundHandler)` **above** `app.use('/api', apiRouter)`.

```powershell
npm test -w backend
```

Read which tests fail, then restore the order.

**What to take away:** Express is an ordered pipeline. "Route not found" is simply "no layer handled
the request before this one".

## 4. Add an endpoint the way the codebase expects

Create `backend/src/modules/time/time.routes.ts`:

```ts
import { Router } from 'express';

export const timeRouter: Router = Router();

timeRouter.get('/', (_req, res) => {
  res.status(200).json({ data: { now: new Date().toISOString() } });
});
```

Mount it in `backend/src/routes/index.ts` under `/time`, then write a test beside the existing ones
that asserts the response shape.

**Questions to answer for yourself**

- Why is there no controller or service file here?
- What would make you add one?
- Is this route consistent with `docs/api-conventions.md`?

## 5. Prove the zoneless rule

Temporarily change `App` to store the result in a plain field instead of a signal:

```ts
private health?: ApiHealth;

protected checkHealth(): void {
  this.healthService.getHealth().subscribe((health) => (this.health = health)); // no set()
}
```

Adjust the template to read the field, run `npm run dev`, and click "Check again".

The view will stop updating. Revert.

**What to take away:** without `zone.js`, nothing tells Angular that an async callback ran. Signals are
the notification channel.

## 6. Inspect the proxy boundary

With `npm run dev` running:

```powershell
curl.exe -s http://localhost:4200/api/health
curl.exe -s http://localhost:3000/api/health
```

Identical bodies, different ports. Now stop only the backend and request `:4200` again: the dev
server logs `http proxy error: /api/health` with `ECONNREFUSED`. Reload the browser and you should see
the "API is unreachable" state with the retry button.

**What to take away:** the proxy is a dev-server feature, not part of the app. In production the same
`/api` path must resolve through the real deployment topology.

## 7. Inspect the monorepo wiring

```powershell
npm ls typescript
Get-ChildItem node_modules\@worknest
```

You should see both compiler versions and symlinks from `node_modules/@worknest/*` to the workspace
directories.

**What to take away:** workspace packages are linked, not copied. A change in `backend/src` is visible
to tooling at the root immediately, with no build step.

---

## Review questions

### Backend

1. Why does `createApp()` return an app instead of calling `app.listen()`? What would the tests have to
   do differently if it listened?
2. `loadEnv()` accepts a `source` parameter. Name one bug this design prevents and one behaviour it
   makes testable.
3. A teammate adds an `async` handler that throws. In Express 5, trace the path the error takes and
   where the real message ends up.
4. Why does the error middleware need four parameters, and what breaks if one is removed?
5. Why is `/api/health` allowed to have no service layer? What would force one to appear?
6. What is the difference between liveness and readiness, and why should they be separate endpoints?
7. `server.close()` is called on shutdown. What exactly does it do, and why is there also a timer?
8. Why does this project have two `tsconfig` files for the backend?

### Frontend

9. In a zoneless app, why does a plain field updated in an `subscribe` callback fail to update the
   view, while a signal works?
10. Why is `HealthState` written as a union instead of three independent fields? Give one concrete bug
    the union prevents.
11. `HealthService` maps `response.data` before returning. What has to change if the backend renames
    its envelope?
12. `HttpErrorResponse.status === 0` — what does it actually mean, and why treat it differently from
    a `500`?

### Security

13. A request from `http://evil.example` receives `200` with no allow-origin header. Is it "blocked"?
    By whom, and at which step?
14. Why is CORS not an authorization mechanism, and where will authorization actually live?
15. `.env.example` is committed while `.env` is ignored. Why is that split safe, and what is the only
    real response to an accidentally committed secret?

### Tooling

16. Why can the frontend and backend use different TypeScript versions, and what does that forbid?
17. Why is there one `package-lock.json` at the root and none per workspace?

---

## How to check your own work

Before calling a change finished:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
git status
```

All five must pass, and `git status` must not reveal a file you did not intend to change. If a test
fails, read the assertion before touching production code — the test may be right.
