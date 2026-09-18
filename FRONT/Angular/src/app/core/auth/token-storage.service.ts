import { Injectable } from '@angular/core';

const STORAGE_KEY = 'auth.session';

export interface StoredSession {
  readonly token: string;
  readonly expiresAtUtc: string;
  readonly username: string;
  readonly role: string;
}

/**
 * Thin wrapper around `localStorage` so components/services never touch the
 * browser API directly — keeps them trivially testable with a fake.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  read(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  write(session: StoredSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
