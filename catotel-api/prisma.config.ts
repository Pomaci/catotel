import { defineConfig, env } from 'prisma/config';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

['.env', 'prisma/.env']
  .map((relativePath) => resolve(__dirname, relativePath))
  .filter((absolutePath) => existsSync(absolutePath))
  .forEach((absolutePath) => {
    loadEnv({ path: absolutePath, override: false });
  });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
