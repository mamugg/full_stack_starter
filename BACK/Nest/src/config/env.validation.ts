import * as Joi from 'joi';

/**
 * Validated once at boot (see ConfigModule.forRoot in app.module.ts) so a
 * missing or malformed .env fails fast at startup instead of on the first
 * request that happens to need it.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),

  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET doit contenir au moins 32 caracteres (256 bits) pour HMAC-SHA256.',
  }),
  JWT_EXPIRES_MINUTES: Joi.number().min(1).max(1440).default(60),

  CORS_ALLOWED_ORIGINS: Joi.string().allow('').default(''),

  EXTERNAL_JSONPLACEHOLDER_URL: Joi.string().uri().default('https://jsonplaceholder.typicode.com/'),
});
