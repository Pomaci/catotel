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

type SeedData = Awaited<ReturnType<typeof seedTestData>>;

describe('Hotel management (e2e)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let seed: SeedData;

  beforeAll(() => {
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
    seed = await seedTestData();

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
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterEach(async () => {
    await app.close();
    await prismaTestClient.$disconnect();
  });

  const loginAs = async (email: string, password: string) => {
    const res = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    return res.body.access_token as string;
  };

  it('manages room types and rooms (happy + negative)', async () => {
    const adminToken = await loginAs('admin@test.com', 'Admin123!');
    const checkIn = new Date('2030-01-09').toISOString();
    const checkOut = new Date('2030-01-14').toISOString();

    const availabilityRes = await request(server)
      .get('/api/v1/room-types')
      .query({ checkIn, checkOut })
      .expect(200);

    expect(Array.isArray(availabilityRes.body)).toBe(true);
    const seededRoomType = availabilityRes.body.find(
      (roomType: Record<string, any>) => roomType.id === seed.roomType.id,
    );
    expect(seededRoomType).toBeDefined();
    expect(seededRoomType.availableUnits).toBeGreaterThanOrEqual(1);
    expect(seededRoomType.availableSlots).toBeGreaterThan(0);

    const newTypePayload = {
      name: 'Skyline Loft',
      description: 'Top floor corner suite',
      capacity: 3,
      nightlyRate: 255.75,
      overbookingLimit: 2,
      isActive: true,
    };

    const createTypeRes = await request(server)
      .post('/api/v1/room-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newTypePayload)
      .expect(201);

    const createdRoomTypeId = createTypeRes.body.id as string;
    expect(createTypeRes.body.name).toBe('Skyline Loft');

    await request(server)
      .patch(`/api/v1/room-types/${createdRoomTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated skyline suite', overbookingLimit: 1 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.description).toContain('Updated');
        expect(body.overbookingLimit).toBe(1);
      });

    await request(server)
      .patch('/api/v1/room-types/cghostroomtype0000000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' })
      .expect(404);

    const createRoomRes = await request(server)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Suite',
        roomTypeId: createdRoomTypeId,
        description: 'Testing inventory',
        isActive: true,
      })
      .expect(201);
    expect(createRoomRes.body.roomType.id).toBe(createdRoomTypeId);

    await request(server)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Broken Room',
        roomTypeId: seed.inactiveRoomType.id,
      })
      .expect(400);
  });

  it('performs addon service CRUD with error handling', async () => {
    const adminToken = await loginAs('admin@test.com', 'Admin123!');

    const createRes = await request(server)
      .post('/api/v1/admin/addon-services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Spa Bath',
        description: 'Foam bath and grooming',
        price: 45.5,
        isActive: true,
      })
      .expect(201);
    const addonId = createRes.body.id as string;
    expect(createRes.body.name).toBe('Spa Bath');

    await request(server)
      .patch(`/api/v1/admin/addon-services/${addonId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 55.75, isActive: false })
      .expect(200)
      .expect(({ body }) => {
        expect(Number(body.price)).toBeCloseTo(55.75);
        expect(body.isActive).toBe(false);
      });

    const listRes = await request(server)
      .get('/api/v1/admin/addon-services')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      listRes.body.some(
        (service: Record<string, any>) => service.id === addonId,
      ),
    ).toBe(true);

    await request(server)
      .delete(`/api/v1/admin/addon-services/${addonId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toBe(true));

    await request(server)
      .patch('/api/v1/admin/addon-services/cghostaddon0000000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost service' })
      .expect(404);
  });

  it('updates pricing settings and enforces validation', async () => {
    const adminToken = await loginAs('admin@test.com', 'Admin123!');

    await request(server)
      .get('/api/v1/admin/pricing-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toBeNull());

    const payload = {
      multiCatDiscountEnabled: true,
      multiCatDiscounts: [
        { catCount: 2, discountPercent: 5 },
        { catCount: 3, discountPercent: 10 },
      ],
      sharedRoomDiscountEnabled: true,
      sharedRoomDiscountPercent: 8,
      sharedRoomDiscounts: [{ remainingCapacity: 0, discountPercent: 12 }],
      longStayDiscountEnabled: true,
      longStayDiscounts: [{ minNights: 5, discountPercent: 7 }],
      longStayDiscount: { enabled: true, minNights: 14, discountPercent: 15 },
    };

    const updateRes = await request(server)
      .put('/api/v1/admin/pricing-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(200);
    expect(updateRes.body.multiCatDiscounts).toHaveLength(2);
    expect(updateRes.body.sharedRoomDiscountPercent).toBe(8);
    expect(updateRes.body.longStayDiscount.enabled).toBe(true);

    await request(server)
      .put('/api/v1/admin/pricing-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sharedRoomDiscountPercent: 150 })
      .expect(400);

    const additionalCat = await prismaTestClient.cat.create({
      data: { name: 'Luna', customerId: seed.customerProfile.id },
    });
    const customerToken = await loginAs('customer@test.com', 'Admin123!');
    const reservationRes = await request(server)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        roomTypeId: seed.roomType.id,
        checkIn: new Date('2030-02-01').toISOString(),
        checkOut: new Date('2030-02-07').toISOString(),
        catIds: [seed.cat.id, additionalCat.id],
        addons: [{ serviceId: seed.addonFeed.id, quantity: 2 }],
      })
      .expect(201);
    expect(reservationRes.body.totalPrice).toBe('843.58');
  });

  it('lists staff tasks and blocks updates on foreign assignments', async () => {
    const staffToken = await loginAs('staff@test.com', 'Staff123!');

    const listRes = await request(server)
      .get('/api/v1/staff/tasks')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(
      listRes.body.some(
        (task: Record<string, any>) => task.id === seed.assignedTask.id,
      ),
    ).toBe(true);

    await request(server)
      .patch(`/api/v1/staff/tasks/${seed.assignedTask.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'DONE', notes: 'Shift handled' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('DONE');
        expect(body.notes).toContain('Shift handled');
        expect(body.completedAt).toBeDefined();
      });

    const otherTask = await prismaTestClient.careTask.findFirstOrThrow({
      where: { assignedStaffId: seed.reliefProfile.id },
    });

    await request(server)
      .patch(`/api/v1/staff/tasks/${otherTask.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'DONE' })
      .expect(403);
  });
});
