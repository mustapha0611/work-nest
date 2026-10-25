---
name: auth-security-review
description: Review WorkNest authentication, authorization, session/token handling, input boundaries, secrets, and workspace isolation.
---

# Authentication and Security Review

1. Identify the assets, trust boundaries, actors, and threat scenario before recommending changes.
2. Distinguish authentication (who the user is) from authorization (what the user may do).
3. Review server-side checks for workspace membership, role permissions, ownership, and resource IDs supplied by clients.
4. Review password hashing, session/token lifecycle, cookie or storage choices, CSRF considerations where applicable, logout/revocation, and secret handling. Explain trade-offs; do not choose an auth strategy silently.
5. Review request validation, rate limiting, CORS, security headers, error messages, logging, and dependency maintenance where relevant.
6. Never expose passwords, hashes, tokens, cookies, or secrets in responses or logs.
7. Add or recommend tests for unauthenticated, unauthorized, cross-workspace, expired/invalid credential, and privilege-escalation cases.
8. Prioritize findings by severity and explain impact and remediation. Do not claim a complete security audit from a narrow code review.
9. Run checks only when available and report actual results.
10. Explain the underlying vulnerability class and ask 2–4 understanding questions.
