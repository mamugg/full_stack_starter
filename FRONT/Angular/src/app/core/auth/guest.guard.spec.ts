import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { guestGuard } from './guest.guard';

function setup(isAuthenticated: boolean) {
  TestBed.configureTestingModule({
    providers: [{ provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } }],
  });
  return TestBed.inject(Router);
}

describe('guestGuard', () => {
  it('allows navigation when not authenticated', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('redirects to /todos when already authenticated', () => {
    const router = setup(true);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result)).toBe('/todos');
  });
});
