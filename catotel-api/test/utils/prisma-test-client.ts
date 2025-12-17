import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import path from 'path';
import {
  PrismaClient,
  UserRole,
  Prisma,
  CareTaskStatus,
  CareTaskType,
  ReservationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const TEST_DB_PATH = path.join(__dirname, '../../tmp/test.db');
const DATABASE_URL = `file:${TEST_DB_PATH}`;

export function prepareTestDatabase() {
  process.env.DATABASE_URL = DATABASE_URL;
  if (existsSync(TEST_DB_PATH)) {
    rmSync(TEST_DB_PATH);
  }
  execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../../'),
    env: { ...process.env, DATABASE_URL },
  });
}

export const prismaTestClient = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

export async function seedTestData() {
  const password = await bcrypt.hash('Admin123!', 10);
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const admin = await prismaTestClient.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password, role: UserRole.ADMIN, name: 'Admin' },
    create: {
      email: 'admin@test.com',
      password,
      role: UserRole.ADMIN,
      name: 'Admin',
    },
  });

  const customerUser = await prismaTestClient.user.upsert({
    where: { email: 'customer@test.com' },
    update: { password, role: UserRole.CUSTOMER, name: 'Customer' },
    create: {
      email: 'customer@test.com',
      password,
      role: UserRole.CUSTOMER,
      name: 'Customer',
    },
  });

  const customerProfile = await prismaTestClient.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: { userId: customerUser.id, phone: '5551234567' },
  });

  const staffUser = await prismaTestClient.user.upsert({
    where: { email: 'staff@test.com' },
    update: {
      password: staffPassword,
      role: UserRole.STAFF,
      name: 'Staffer',
    },
    create: {
      email: 'staff@test.com',
      password: staffPassword,
      role: UserRole.STAFF,
      name: 'Staffer',
    },
  });

  const otherStaffUser = await prismaTestClient.user.upsert({
    where: { email: 'relief@test.com' },
    update: {
      password: staffPassword,
      role: UserRole.STAFF,
      name: 'Relief Staff',
    },
    create: {
      email: 'relief@test.com',
      password: staffPassword,
      role: UserRole.STAFF,
      name: 'Relief Staff',
    },
  });

  const staffProfile = await prismaTestClient.staffProfile.upsert({
    where: { userId: staffUser.id },
    update: {
      position: 'Concierge',
      phone: '5557654321',
    },
    create: {
      userId: staffUser.id,
      position: 'Concierge',
      phone: '5557654321',
    },
  });

  const reliefProfile = await prismaTestClient.staffProfile.upsert({
    where: { userId: otherStaffUser.id },
    update: {
      position: 'Relief',
      phone: '5557659999',
    },
    create: {
      userId: otherStaffUser.id,
      position: 'Relief',
      phone: '5557659999',
    },
  });

  const cat = await prismaTestClient.cat.create({
    data: { name: 'Mia', customerId: customerProfile.id },
  });

  const roomType = await prismaTestClient.roomType.create({
    data: {
      name: 'Sunshine Suite',
      description: 'Large window perch',
      capacity: 2,
      nightlyRate: new Prisma.Decimal('180.50'),
      overbookingLimit: 1,
      isActive: true,
    },
  });

  const inactiveRoomType = await prismaTestClient.roomType.create({
    data: {
      name: 'Renovation Pod',
      description: 'Currently unavailable',
      capacity: 1,
      nightlyRate: new Prisma.Decimal('95.00'),
      overbookingLimit: 0,
      isActive: false,
    },
  });

  const room = await prismaTestClient.room.create({
    data: {
      name: 'Deluxe',
      description: 'Primary stock room',
      roomTypeId: roomType.id,
      isActive: true,
    },
  });

  const addonFeed = await prismaTestClient.addonService.create({
    data: { name: 'Ek mama', price: new Prisma.Decimal('10.25') },
  });

  const reservation = await prismaTestClient.reservation.create({
    data: {
      code: 'RES-SEED-1',
      customerId: customerProfile.id,
      roomTypeId: roomType.id,
      allowRoomSharing: true,
      reservedSlots: 1,
      status: ReservationStatus.PENDING,
      checkIn: new Date('2030-01-10T09:00:00.000Z'),
      checkOut: new Date('2030-01-12T09:00:00.000Z'),
      totalPrice: new Prisma.Decimal('361.00'),
      specialRequests: 'Window perch, please',
    },
  });

  await prismaTestClient.reservationCat.create({
    data: { reservationId: reservation.id, catId: cat.id },
  });

  const assignedTask = await prismaTestClient.careTask.create({
    data: {
      reservationId: reservation.id,
      catId: cat.id,
      assignedStaffId: staffProfile.id,
      type: CareTaskType.FEEDING,
      status: CareTaskStatus.IN_PROGRESS,
      scheduledAt: new Date('2030-01-10T11:00:00.000Z'),
      notes: 'Morning feeding for Mia',
    },
  });

  await prismaTestClient.careTask.create({
    data: {
      reservationId: reservation.id,
      catId: cat.id,
      assignedStaffId: reliefProfile.id,
      type: CareTaskType.MEDICATION,
      status: CareTaskStatus.OPEN,
      scheduledAt: new Date('2030-01-10T12:00:00.000Z'),
      notes: 'Give allergy pill',
    },
  });

  return {
    admin,
    staffUser,
    staffProfile,
    reliefStaff: otherStaffUser,
    reliefProfile,
    customerUser,
    customerProfile,
    cat,
    room,
    roomType,
    inactiveRoomType,
    addonFeed,
    reservation,
    assignedTask,
  };
}
