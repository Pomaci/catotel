import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { InMemoryPrismaService } from './utils/in-memory-prisma.service';

describe('Authentication sessions (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;

  beforeAll(() => {
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://test:test@localhost:5432/catotel_test?schema=public';
    process.env.ACCESS_TOKEN_SECRET =
      process.env.ACCESS_TOKEN_SECRET ?? 'test-access-secret';
    process.env.REFRESH_TOKEN_SECRET =
      process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-secret';
    process.env.ACCESS_TOKEN_TTL = '15m';
    process.env.REFRESH_TOKEN_TTL = '7d';
    process.env.JWT_ISSUER = 'catotel-api';
    process.env.JWT_AUDIENCE = 'catotel-client';
    process.env.MAX_SESSIONS_PER_USER = '3';
  });

  beforeEach(async () => {
    prisma = new InMemoryPrismaService();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('enforces max sessions per user and rotates oldest on new login', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const registerDto = {
      email: 'session-limit@example.com',
      password: 'StrongPass123!',
      name: 'Session Limit',
    };

    await request(server)
      .post('/api/v1/users/register')
      .send(registerDto)
      .expect(201);

    const login = (ua: string) =>
      request(server)
        .post('/api/v1/auth/login')
        .set('User-Agent', ua)
        .set('x-forwarded-for', ua.replace(/\D/g, '') || '127.0.0.1')
        .send({ email: registerDto.email, password: registerDto.password })
        .expect(201);

    await login('UA-1');
    await login('UA-2');
    await login('UA-3');

    let sessions = await prisma.session.findMany({
      where: { isRevoked: false },
      orderBy: { createdAt: 'asc' },
      select: { id: true, userAgent: true, isRevoked: true },
    });
    expect(sessions).toHaveLength(3);

    await login('UA-4');

    sessions = await prisma.session.findMany({
      where: { isRevoked: false },
      orderBy: { createdAt: 'asc' },
      select: { userAgent: true },
    });

    const activeAgents = sessions.map((s) => s.userAgent);
    expect(activeAgents).toContain('UA-2');
    expect(activeAgents).toContain('UA-3');
    expect(activeAgents).toContain('UA-4');
  });
});
