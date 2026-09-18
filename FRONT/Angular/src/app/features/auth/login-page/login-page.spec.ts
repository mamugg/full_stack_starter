import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginPage } from './login-page';

function setup(loginResult: 'success' | 'invalid-credentials') {
  const login = vi.fn(() =>
    loginResult === 'success'
      ? of({ username: 'admin', role: 'Admin', expiresAtUtc: '2030-01-01T00:00:00Z' })
      : throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Identifiants invalides.' } })),
  );
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [
      { provide: AuthService, useValue: { login } },
      { provide: Router, useValue: { navigateByUrl } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: { get: () => null } } },
      },
    ],
  });

  const fixture = TestBed.createComponent(LoginPage);
  fixture.detectChanges();
  return { fixture, login, navigateByUrl };
}

describe('LoginPage', () => {
  it('logs in and navigates to /todos on success', () => {
    const { fixture, login, navigateByUrl } = setup('success');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});

    expect(login).toHaveBeenCalledWith({ username: 'admin', password: 'Admin123!' });
    expect(navigateByUrl).toHaveBeenCalledWith('/todos');
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('shows an error and stops submitting on invalid credentials', () => {
    const { fixture, navigateByUrl } = setup('invalid-credentials');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage()).toBe('Identifiants invalides.');
    expect(fixture.componentInstance.submitting()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Identifiants invalides.');
  });

  it('does not submit an invalid form', () => {
    const { fixture, login } = setup('success');
    fixture.componentInstance.form.controls.username.setValue('');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});

    expect(login).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.touched).toBe(true);
  });
});
