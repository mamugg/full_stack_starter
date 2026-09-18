import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { authExpiryInterceptor } from './auth-expiry.interceptor';

function setup() {
  const logout = vi.fn();
  const navigate = vi.fn().mockResolvedValue(true);

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authExpiryInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { logout } },
      { provide: Router, useValue: { navigate } },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
    logout,
    navigate,
  };
}

describe('authExpiryInterceptor', () => {
  it('logs out and redirects to /login on a 401 from a protected endpoint', () => {
    const { http, httpMock, logout, navigate } = setup();

    http.get('/api/todoitems').subscribe({ error: () => {} });
    httpMock.expectOne('/api/todoitems').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login']);

    httpMock.verify();
  });

  it('does not log out on a 401 from the login endpoint itself', () => {
    const { http, httpMock, logout, navigate } = setup();

    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    httpMock.verify();
  });

  it('leaves other error statuses untouched', () => {
    const { http, httpMock, logout, navigate } = setup();

    http.get('/api/todoitems/999').subscribe({ error: () => {} });
    httpMock.expectOne('/api/todoitems/999').flush(null, { status: 404, statusText: 'Not Found' });

    expect(logout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    httpMock.verify();
  });
});
