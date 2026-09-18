export type UserRole = 'Admin' | 'User';

export class User {
  id!: number;
  username!: string;
  passwordHash!: string;
  role!: UserRole;
}
