import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route (or a whole controller) out of the global JwtAuthGuard.
 * Everything is protected by default; mark the exceptions explicitly.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
