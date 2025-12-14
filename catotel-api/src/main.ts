import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvVars } from './config/config.schema';
import { swaggerConfig, swaggerPath } from './config/swagger.config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.enableShutdownHooks();
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const configService = app.get(ConfigService<EnvVars>);
  const rawCorsOrigins = configService.getOrThrow<string>('CORS_ORIGINS', {
    infer: true,
  });
  const corsOrigins = parseOrigins(rawCorsOrigins);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin ?? 'unknown'}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // CSRF header intentionally omitted until a server-side check is implemented.
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
    ],
    credentials: true,
  };

  app.enableCors(corsOptions);

  const nodeEnv = configService.getOrThrow<
    'development' | 'test' | 'production'
  >('NODE_ENV', {
    infer: true,
  });
  const isProd = nodeEnv === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: isProd ? undefined : false,
    }),
  );

  if (!isProd) {
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });
    SwaggerModule.setup(swaggerPath, app, document, {
      jsonDocumentUrl: `${swaggerPath}/schema.json`,
      customSiteTitle: 'Catotel API Docs',
    });
  }

  const rawPort: unknown = configService.get('PORT', { infer: true });
  const port =
    typeof rawPort === 'number' && Number.isFinite(rawPort) ? rawPort : 3000;
  await app.listen(port, '0.0.0.0');
}

function parseOrigins(raw?: string | string[] | null): string[] {
  const rawList: string[] = [];

  if (Array.isArray(raw)) {
    rawList.push(
      ...raw.filter((value): value is string => typeof value === 'string'),
    );
  } else if (typeof raw === 'string') {
    rawList.push(...raw.split(','));
  }

  const normalized = rawList
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  if (normalized.length === 0) {
    throw new Error(
      'CORS_ORIGINS must include at least one valid origin (comma-separated)',
    );
  }

  return normalized;
}

function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('only http and https origins are supported');
    }

    return url.origin;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid CORS origin "${origin}": ${reason}`);
  }
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application', error);
  process.exit(1);
});
