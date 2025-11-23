import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerPath = 'docs';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Catotel API')
  .setDescription(
    'Auth-first API for the Catotel platform. Includes device sessions, token rotation, and health checks.',
  )
  .setVersion('1.0.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Provide the short-lived access token returned by /auth/login',
    },
    'access-token',
  )
  .build();
