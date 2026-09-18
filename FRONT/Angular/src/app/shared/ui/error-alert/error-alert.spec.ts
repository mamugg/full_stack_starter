import { TestBed } from '@angular/core/testing';
import { ErrorAlert } from './error-alert';

describe('ErrorAlert', () => {
  it('renders the given message', async () => {
    await TestBed.configureTestingModule({ imports: [ErrorAlert] }).compileComponents();
    const fixture = TestBed.createComponent(ErrorAlert);
    fixture.componentRef.setInput('message', 'Une erreur est survenue.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Une erreur est survenue.');
  });
});
