import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { Shell } from './shell';

function setup(user: { username: string; role: string } | null) {
  const logout = vi.fn();
  TestBed.configureTestingModule({
    imports: [Shell],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      { provide: AuthService, useValue: { user: signal(user), logout } },
    ],
  });

  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  return { fixture, logout };
}

describe('Shell', () => {
  it('shows a login link when logged out', () => {
    const { fixture } = setup(null);
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeTruthy();
  });

  it('shows the username and logs out on click when logged in', () => {
    const { fixture, logout } = setup({ username: 'admin', role: 'Admin' });

    expect(fixture.nativeElement.textContent).toContain('admin (Admin)');

    fixture.debugElement.query(By.css('button')).triggerEventHandler('click', {});

    expect(logout).toHaveBeenCalledOnce();
  });

  it('navigates to /login after logout', async () => {
    const { fixture } = setup({ username: 'admin', role: 'Admin' });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.debugElement.query(By.css('button')).triggerEventHandler('click', {});

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
