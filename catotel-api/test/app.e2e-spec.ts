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

type RegisterResponse = { id: string; email: string; name?: string };
type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: { email: string };
};
type SessionsResponse = Array<{
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}>;

describe('Authentication (e2e)', () => {
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

  it('registers, authenticates, refreshes, lists, and logs out a user', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const registerDto = {
      email: 'auth-e2e@example.com',
      password: 'StrongPass123!',
      name: 'Auth E2E',
    };

    const registerRes = await request(server)
      .post('/api/v1/users/register')
      .send(registerDto)
      .expect(201);

    const registerBody = registerRes.body as RegisterResponse;
    expect(registerBody).toMatchObject({
      email: registerDto.email,
      name: registerDto.name,
    });
    expect(registerBody).toHaveProperty('id');

    const loginRes = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(201);

    const loginBody = loginRes.body as LoginResponse;
    expect(loginBody).toMatchObject({
      user: { email: registerDto.email },
    });
    expect(loginBody).toHaveProperty('access_token');
    expect(loginBody).toHaveProperty('refresh_token');

    const initialAccessToken = loginBody.access_token;
    const initialRefreshToken = loginBody.refresh_token;

    const sessionsRes = await request(server)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${initialAccessToken}`)
      .expect(200);

    const sessionsBody = sessionsRes.body as SessionsResponse;
    expect(Array.isArray(sessionsBody)).toBe(true);
    expect(sessionsBody).toHaveLength(1);

    const [sessionBeforeRefresh] = (await prisma.session.findMany({
      select: { refreshToken: true },
    })) as Array<{ refreshToken: string }>;

    const refreshRes = await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: initialRefreshToken })
      .expect(201);

    const refreshBody = refreshRes.body as {
      access_token: string;
      refresh_token: string;
    };
    const nextAccessToken = refreshBody.access_token;
    const nextRefreshToken = refreshBody.refresh_token;
    expect(nextRefreshToken).not.toEqual(initialRefreshToken);

    const sessionsSnapshot = (await prisma.session.findMany({
      select: { refreshToken: true, isRevoked: true },
    })) as Array<{
      refreshToken: string;
      isRevoked: boolean;
    }>;
    expect(sessionsSnapshot).toHaveLength(1);
    expect(sessionsSnapshot[0].refreshToken).not.toEqual(
      sessionBeforeRefresh.refreshToken,
    );

    await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: initialRefreshToken })
      .expect(403);

    await request(server)
      .post('/api/v1/auth/logout')
      .send({ refresh_token: nextRefreshToken })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ message: 'Logged out successfully' });
      });

    const sessionsAfterLogout = await request(server)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${nextAccessToken}`)
      .expect(200);

    const sessionsAfterLogoutBody =
      sessionsAfterLogout.body as SessionsResponse;
    expect(sessionsAfterLogoutBody).toHaveLength(0);
  });
});
