# API Conventions

Planning defaults; confirm and refine these when the first endpoints are implemented.

- Prefix API endpoints with `/api` unless an approved alternative is chosen.
- Use nouns for resource paths and appropriate HTTP methods for operations.
- Validate request body, route parameters, and query parameters at the boundary.
- Return appropriate HTTP status codes and a consistent error structure.
- Do not return password hashes, secrets, tokens, or unnecessary personal data.
- Enforce authentication and authorization on the server for protected resources.
- Use pagination for lists that may grow; document pagination and filtering parameters.
- Document stable endpoints with OpenAPI after the initial API shape is established.
- Add integration tests for success, validation failures, not-found cases, unauthenticated requests, and forbidden access.

Proposed error response shape (to be approved when implementing):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "details": []
  }
}
```
