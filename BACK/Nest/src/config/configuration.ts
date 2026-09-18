/**
 * Placeholder JWT secret shipped in .env.example / .env so the project runs
 * immediately after a clone, in development only. main.ts refuses to start
 * in NODE_ENV=production if this exact value is still in use.
 */
export const DEV_PLACEHOLDER_JWT_SECRET = 'Cle-Secrete-Dev-Nest-Changez-Moi-En-Production-1234567890';

export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    secret: process.env.JWT_SECRET,
    expiresMinutes: parseInt(process.env.JWT_EXPIRES_MINUTES ?? '60', 10),
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  },
  externalApis: {
    jsonPlaceholder: process.env.EXTERNAL_JSONPLACEHOLDER_URL ?? 'https://jsonplaceholder.typicode.com/',
  },
});
