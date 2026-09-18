import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authentifie un utilisateur de demo et renvoie un token JWT.
   * Comptes disponibles : admin / Admin123! (role Admin) et user / User123! (role User).
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion, renvoie un token JWT' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Requete invalide' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * Route protegee : necessite un token JWT valide (header Authorization: Bearer <token>).
   * Permet de verifier que le token est bien reconnu et d'inspecter ses claims.
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil courant, deduit du token JWT' })
  @ApiResponse({ status: 200, description: 'Claims du token courant' })
  @ApiResponse({ status: 401, description: 'Non authentifie' })
  me(@CurrentUser() user: JwtPayload) {
    return {
      username: user.name,
      role: user.role,
      claims: [
        { type: 'sub', value: user.sub },
        { type: 'jti', value: user.jti },
        { type: 'name', value: user.name },
        { type: 'role', value: user.role },
      ],
    };
  }
}
