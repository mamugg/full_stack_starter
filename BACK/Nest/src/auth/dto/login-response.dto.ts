import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

/** Mirrors `LoginResponse` from the .NET API so the Angular front needs no changes. */
export class LoginResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  expiresAtUtc!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  role!: UserRole;
}
