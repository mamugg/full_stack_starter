import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(TokenStorageService);
  });

  it('returns null when nothing is stored', () => {
    expect(service.read()).toBeNull();
  });

  it('round-trips a session', () => {
    const session = {
      token: 'abc',
      expiresAtUtc: '2030-01-01T00:00:00.000Z',
      username: 'admin',
      role: 'Admin',
    };

    service.write(session);

    expect(service.read()).toEqual(session);
  });

  it('clears the stored session', () => {
    service.write({ token: 'abc', expiresAtUtc: '2030-01-01T00:00:00.000Z', username: 'admin', role: 'Admin' });
    service.clear();

    expect(service.read()).toBeNull();
  });

  it('discards corrupted data instead of throwing', () => {
    localStorage.setItem('auth.session', '{not-json');

    expect(service.read()).toBeNull();
    expect(localStorage.getItem('auth.session')).toBeNull();
  });
});
