import { UserRole } from './entities/user.entity';

/**
 * Claims encoded in the JWT (registered `sub`/`jti` + custom `name`/`role`).
 * `JwtStrategy.validate` attaches this as-is to `request.user` so
 * `GET /api/auth/me` can echo back the individual claims, like the .NET API does.
 */
export interface JwtPayload {
  sub: string;
  jti: string;
  name: string;
  role: UserRole;
}
