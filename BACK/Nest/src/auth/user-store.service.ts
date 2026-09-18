import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

const SALT_ROUNDS = 10;

/**
 * Two demo users, in memory (no database) — mirrors the .NET starter so both
 * backends can be swapped behind the same Angular front with the same
 * credentials. Passwords are hashed with bcrypt, never stored in clear text.
 *
 * Demo accounts: admin / Admin123! and user / User123!
 */
@Injectable()
export class UserStoreService {
  private readonly users: User[] = [
    { id: 1, username: 'admin', role: 'Admin', passwordHash: bcrypt.hashSync('Admin123!', SALT_ROUNDS) },
    { id: 2, username: 'user', role: 'User', passwordHash: bcrypt.hashSync('User123!', SALT_ROUNDS) },
  ];

  findByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
