import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DEV_PLACEHOLDER_JWT_SECRET } from './config/configuration';
import { validationExceptionFactory } from './common/validation-exception.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const nodeEnv = configService.getOrThrow<string>('nodeEnv');
  const isProduction = nodeEnv === 'production';

  // Filet de securite : refuse de demarrer en production avec le secret JWT
  // de developpement fourni par defaut dans .env.example.
  if (isProduction && configService.getOrThrow<string>('jwt.secret') === DEV_PLACEHOLDER_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET utilise encore la valeur de developpement fournie par defaut. ' +
        'Definissez une cle secrete unique avant de demarrer en production.',
    );
  }

  app.use(helmet());
  app.setGlobalPrefix('api');

  // CORS : aucune origine autorisee par defaut ; a renseigner via
  // CORS_ALLOWED_ORIGINS pour un frontend qui consommerait l'API depuis un navigateur.
  const allowedOrigins = configService.getOrThrow<string[]>('cors.allowedOrigins');
  app.enableCors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Swagger reserve au developpement, comme le Program.cs .NET.
  if (!isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('API Rest NestJS')
        .setDescription('CRUD en memoire, login JWT, appels vers une API publique.')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('swagger', app, document);
  }

  const port = configService.getOrThrow<number>('port');
  await app.listen(port);
  logger.log(`API demarree sur http://localhost:${port}/api`);
  if (!isProduction) {
    logger.log(`Swagger UI disponible sur http://localhost:${port}/swagger`);
  }
}

void bootstrap();
