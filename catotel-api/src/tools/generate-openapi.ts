import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../app.module';
import { swaggerConfig } from '../config/swagger.config';
import { StructuredLogger } from '../common/logger/structured-logger';

const toolLogger = new StructuredLogger('OpenAPI');

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule);
  try {
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });
    const outputDir = join(__dirname, '..', '..', 'openapi');
    await mkdir(outputDir, { recursive: true });
    const outputPath = join(outputDir, 'catotel-api.json');
    await writeFile(outputPath, JSON.stringify(document, null, 2), 'utf-8');
    toolLogger.log('OpenAPI schema written', { outputPath });
  } finally {
    await app.close();
  }
}

generateOpenApi().catch((err) => {
  toolLogger.error(
    'Failed to generate OpenAPI schema',
    { error: err instanceof Error ? err.message : String(err) },
    err instanceof Error ? err.stack : undefined,
  );
  process.exit(1);
});
