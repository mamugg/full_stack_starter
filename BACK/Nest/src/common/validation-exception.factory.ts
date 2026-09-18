import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Reshapes class-validator errors into the same envelope the Angular front
 * already knows how to read (`extractErrorMessage`, shared with the .NET
 * backend's `ValidationProblemDetails`): `{ title, errors: { field: [msg] } }`
 * instead of Nest's default `{ statusCode, message: string[] }`.
 */
export function validationExceptionFactory(validationErrors: ValidationError[] = []): BadRequestException {
  const errors: Record<string, string[]> = {};

  for (const error of validationErrors) {
    errors[error.property] = Object.values(error.constraints ?? {});
  }

  return new BadRequestException({
    title: 'Une ou plusieurs erreurs de validation sont survenues.',
    errors,
  });
}
