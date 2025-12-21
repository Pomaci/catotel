import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  prepareTestDatabase,
  prismaTestClient,
  seedTestData,
} from './utils/prisma-test-client';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Reservations (e2e, real Prisma)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ACCESS_TOKEN_SECRET =
      process.env.ACCESS_TOKEN_SECRET ?? 'test-access-secret';
    process.env.REFRESH_TOKEN_SECRET =
      process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-secret';
    process.env.ACCESS_TOKEN_TTL = '15m';
    process.env.REFRESH_TOKEN_TTL = '7d';
    process.env.JWT_ISSUER = 'catotel-api';
    process.env.JWT_AUDIENCE = 'catotel-client';
    prepareTestDatabase();
  });

  beforeEach(async () => {
    await prismaTestClient.$disconnect();
    prepareTestDatabase();
    await seedTestData();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaTestClient)
      .compile();

    app = moduleRef.createNestApplication();
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
    await prismaTestClient.$disconnect();
  });

  it('creates reservation with decimal pricing and rejects overlap', async () => {
    const server = app.getHttpServer();
    const loginRes = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@test.com', password: 'Admin123!' })
      .expect(201);
    const accessToken = loginRes.body.access_token as string;

    const room = await prismaTestClient.room.findFirst();
    const cat = await prismaTestClient.cat.findFirst();
    const addon = await prismaTestClient.addonService.findFirst();
    const reservationPayload = {
      roomId: room!.id,
      checkIn: new Date('2025-12-01').toISOString(),
      checkOut: new Date('2025-12-03').toISOString(),
      catIds: [cat!.id],
      addons: [{ serviceId: addon!.id, quantity: 2 }],
    };

    const createRes = await request(server)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(reservationPayload)
      .expect(201);

    expect(createRes.body.totalPrice).toBe('321.50');

    await request(server)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...reservationPayload,
        checkIn: new Date('2025-12-02').toISOString(),
        checkOut: new Date('2025-12-04').toISOString(),
      })
      .expect(400);
  });
});
