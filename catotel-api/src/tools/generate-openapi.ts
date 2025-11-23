import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../app.module';
import { swaggerConfig } from '../config/swagger.config';

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
    console.log(`OpenAPI schema written to ${outputPath}`);
  } finally {
    await app.close();
  }
}

generateOpenApi().catch((err) => {
  console.error('Failed to generate OpenAPI schema', err);
  process.exit(1);
});
