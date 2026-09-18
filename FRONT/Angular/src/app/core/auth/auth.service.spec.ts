import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthService } from './auth.service';
import { LoginResponse } from './models/auth.model';

const BASE_URL = 'https://api.test/api';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE_URL },
    ],
  });

  return {
    service: TestBed.inject(AuthService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('AuthService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts unauthenticated when nothing is stored', () => {
    const { service, httpMock } = setup();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.currentToken()).toBeNull();

    httpMock.verify();
  });

  it('logs in, exposes the user, and stores the session', () => {
    const { service, httpMock } = setup();
    const response: LoginResponse = {
      token: 'fake.jwt.token',
      expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
      username: 'admin',
      role: 'Admin',
    };

    let received: unknown;
    service.login({ username: 'admin', password: 'Admin123!' }).subscribe((user) => (received = user));

    const req = httpMock.expectOne(`${BASE_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(received).toEqual({ username: 'admin', role: 'Admin', expiresAtUtc: response.expiresAtUtc });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentToken()).toBe('fake.jwt.token');

    httpMock.verify();
  });

  it('restores a valid session from storage on startup', () => {
    localStorage.setItem(
      'auth.session',
      JSON.stringify({
        token: 'stored.jwt.token',
        expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
        username: 'user',
        role: 'User',
      }),
    );

    const { service, httpMock } = setup();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('user');

    httpMock.verify();
  });

  it('discards an expired session from storage on startup', () => {
    localStorage.setItem(
      'auth.session',
      JSON.stringify({
        token: 'expired.jwt.token',
        expiresAtUtc: new Date(Date.now() - 60_000).toISOString(),
        username: 'user',
        role: 'User',
      }),
    );

    const { service, httpMock } = setup();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('auth.session')).toBeNull();

    httpMock.verify();
  });

  it('clears the session on logout', () => {
    const { service, httpMock } = setup();
    service.login({ username: 'admin', password: 'Admin123!' }).subscribe();
    httpMock
      .expectOne(`${BASE_URL}/auth/login`)
      .flush({ token: 't', expiresAtUtc: new Date(Date.now() + 60_000).toISOString(), username: 'admin', role: 'Admin' });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentToken()).toBeNull();
    expect(localStorage.getItem('auth.session')).toBeNull();

    httpMock.verify();
  });
});
