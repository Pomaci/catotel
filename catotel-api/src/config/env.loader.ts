import { envSchema } from './config.schema';
import type { EnvVars } from './config.schema';

export function loadAndValidateEnv(config: Record<string, unknown>): EnvVars {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error('Invalid environment variables', parsed.error.flatten());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
