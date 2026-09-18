import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

function setup(isAuthenticated: boolean) {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } }],
  });
  return TestBed.inject(Router);
}

describe('authGuard', () => {
  const route = {} as never;

  it('allows navigation when authenticated', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard(route, { url: '/todos' } as never));

    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when not authenticated', () => {
    const router = setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route, { url: '/todos' } as never)) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Ftodos');
  });
});
