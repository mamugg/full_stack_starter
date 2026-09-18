import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetailsBody {
  readonly title?: string;
  readonly message?: string;
  readonly errors?: Record<string, string[]>;
}

/**
 * Turns an `HttpErrorResponse` into a single user-facing message.
 * Understands the two shapes this API returns: `{ message }` for auth
 * failures and ASP.NET's `ValidationProblemDetails` (`{ title, errors }`)
 * for validation failures.
 */
export function extractErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return "Impossible de contacter le serveur. Vérifiez que l'API est démarrée.";
  }

  const body = error.error as ProblemDetailsBody | undefined;

  if (body?.message) {
    return body.message;
  }

  const firstValidationError = body?.errors && Object.values(body.errors)[0]?.[0];
  if (firstValidationError) {
    return firstValidationError;
  }

  if (body?.title) {
    return body.title;
  }

  return `Une erreur est survenue (${error.status}).`;
}
