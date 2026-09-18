export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

/** Mirrors `LoginResponse` from `ApiRest.Api.Models.Auth`. */
export interface LoginResponse {
  readonly token: string;
  readonly expiresAtUtc: string;
  readonly username: string;
  readonly role: string;
}

export interface AuthenticatedUser {
  readonly username: string;
  readonly role: string;
  readonly expiresAtUtc: string;
}
