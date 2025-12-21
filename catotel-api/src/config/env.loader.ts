import { envSchema } from './config.schema';
import type { EnvVars } from './config.schema';
import { StructuredLogger } from '../common/logger/structured-logger';

const configLogger = new StructuredLogger('Config');

export function loadAndValidateEnv(config: Record<string, unknown>): EnvVars {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    configLogger.error('Invalid environment variables', {
      errors: parsed.error.flatten(),
    });
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
