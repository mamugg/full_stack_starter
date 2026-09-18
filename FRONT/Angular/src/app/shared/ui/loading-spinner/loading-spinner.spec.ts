import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  let fixture: ComponentFixture<LoadingSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoadingSpinner] }).compileComponents();
    fixture = TestBed.createComponent(LoadingSpinner);
  });

  it('shows a default label', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chargement…');
  });

  it('shows a custom label', () => {
    fixture.componentRef.setInput('label', 'Envoi en cours…');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Envoi en cours…');
  });
});
