import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    DATABASE_URL: z.string().url(),

    CORS_ORIGINS: z
      .string()
      .trim()
      .min(1, 'CORS_ORIGINS must include at least one origin')
      .default('http://localhost:3000,http://localhost:3001'),

    ACCESS_TOKEN_SECRET: z
      .string()
      .min(16, 'ACCESS_TOKEN_SECRET must be strong'),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(16, 'REFRESH_TOKEN_SECRET must be strong'),

    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL: z.string().default('7d'),

    JWT_ISSUER: z.string().default('catotel-api'),
    JWT_AUDIENCE: z.string().default('catotel-client'),

    MAX_SESSIONS_PER_USER: z.coerce.number().int().min(1).default(3),
    RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
    RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(120),

    MAIL_ENABLED: booleanFromEnv.default(false),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_SECURE: booleanFromEnv.default(false),
    SMTP_USERNAME: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().optional(),

    PASSWORD_RESET_URL: z
      .string()
      .url()
      .default('http://localhost:3100/auth/reset-password'),
    PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(30),
    PASSWORD_RESET_EMAIL_WINDOW_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(15),
    PASSWORD_RESET_EMAIL_MAX_PER_WINDOW: z.coerce
      .number()
      .int()
      .positive()
      .default(3),
  })
  .superRefine((env, ctx) => {
    if (!env.MAIL_ENABLED) {
      return;
    }

    const missing: string[] = [];
    if (!env.SMTP_HOST) {
      missing.push('SMTP_HOST');
    }
    if (!env.SMTP_USERNAME) {
      missing.push('SMTP_USERNAME');
    }
    if (!env.SMTP_PASSWORD) {
      missing.push('SMTP_PASSWORD');
    }
    if (!env.MAIL_FROM) {
      missing.push('MAIL_FROM');
    }

    if (missing.length) {
      ctx.addIssue({
        code: 'custom',
        message: `MAIL_ENABLED is true but the following SMTP settings are missing: ${missing.join(', ')}`,
        path: ['MAIL_ENABLED'],
      });
    }
  });

export type EnvVars = z.infer<typeof envSchema>;
