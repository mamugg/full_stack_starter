import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './jwt-payload.interface';
import { UserStoreService } from './user-store.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userStore: UserStoreService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login({ username, password }: LoginDto): Promise<LoginResponseDto> {
    const user = this.userStore.findByUsername(username);
    const passwordMatches = user ? await this.userStore.verifyPassword(user, password) : false;

    if (!user || !passwordMatches) {
      // Never log the password, and keep the message generic (don't reveal
      // whether the username or the password was wrong).
      this.logger.warn(`Echec de connexion pour l'utilisateur ${username}`);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    this.logger.log(`Connexion reussie pour l'utilisateur ${user.username}`);

    const expiresMinutes = this.configService.getOrThrow<number>('jwt.expiresMinutes');
    const expiresAtUtc = new Date(Date.now() + expiresMinutes * 60_000);

    const payload: JwtPayload = {
      sub: user.username,
      jti: randomUUID(),
      name: user.username,
      role: user.role,
    };
    const token = this.jwtService.sign(payload, { expiresIn: `${expiresMinutes}m` });

    return { token, expiresAtUtc: expiresAtUtc.toISOString(), username: user.username, role: user.role };
  }
}
