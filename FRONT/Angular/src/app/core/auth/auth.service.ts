import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthenticatedUser, LoginRequest, LoginResponse } from './models/auth.model';
import { StoredSession, TokenStorageService } from './token-storage.service';

function isExpired(expiresAtUtc: string): boolean {
  return Date.parse(expiresAtUtc) <= Date.now();
}

function toUser(session: StoredSession): AuthenticatedUser {
  return { username: session.username, role: session.role, expiresAtUtc: session.expiresAtUtc };
}

/**
 * Holds the authentication state as signals and talks to `/api/auth`.
 * The JWT itself never leaves this service + `TokenStorageService`;
 * everything else reads `user()` / `isAuthenticated()`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly token = signal<string | null>(null);
  private readonly _user = signal<AuthenticatedUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    const session = this.tokenStorage.read();
    if (session && !isExpired(session.expiresAtUtc)) {
      this.token.set(session.token);
      this._user.set(toUser(session));
    } else if (session) {
      this.tokenStorage.clear();
    }
  }

  /** Current bearer token, read synchronously by the auth interceptor. */
  currentToken(): string | null {
    return this.token();
  }

  login(credentials: LoginRequest): Observable<AuthenticatedUser> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.tokenStorage.write(response);
        this.token.set(response.token);
        this._user.set(toUser(response));
      }),
      map((response) => toUser(response)),
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.token.set(null);
    this._user.set(null);
  }
}
