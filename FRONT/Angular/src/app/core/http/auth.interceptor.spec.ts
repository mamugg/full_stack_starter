import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

function setup(token: string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: { currentToken: () => token } },
    ],
  });

  return { http: TestBed.inject(HttpClient), httpMock: TestBed.inject(HttpTestingController) };
}

describe('authInterceptor', () => {
  it('adds an Authorization header when a token is present', () => {
    const { http, httpMock } = setup('my.jwt.token');

    http.get('/api/todoitems').subscribe();

    const req = httpMock.expectOne('/api/todoitems');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my.jwt.token');

    httpMock.verify();
  });

  it('leaves the request untouched when there is no token', () => {
    const { http, httpMock } = setup(null);

    http.get('/api/external/posts').subscribe();

    const req = httpMock.expectOne('/api/external/posts');
    expect(req.request.headers.has('Authorization')).toBe(false);

    httpMock.verify();
  });
});
