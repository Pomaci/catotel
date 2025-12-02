import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import path from 'path';
import { PrismaClient, UserRole, Prisma } from '@prisma/client';
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

  const cat = await prismaTestClient.cat.create({
    data: { name: 'Mia', customerId: customerProfile.id },
  });

  const room = await prismaTestClient.room.create({
    data: {
      name: 'Deluxe',
      capacity: 2,
      nightlyRate: new Prisma.Decimal('150.50'),
      isActive: true,
    },
  });

  const addonFeed = await prismaTestClient.addonService.create({
    data: { name: 'Ek mama', price: new Prisma.Decimal('10.25') },
  });

  return { admin, customerUser, customerProfile, cat, room, addonFeed };
}
