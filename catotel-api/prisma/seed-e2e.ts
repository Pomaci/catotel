import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.E2E_ADMIN_EMAIL ?? 'admin@catotel.test';
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'Admin123!';
  const name = process.env.E2E_ADMIN_NAME ?? 'E2E Admin';

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: UserRole.ADMIN, name },
    create: { email, password: hash, role: UserRole.ADMIN, name },
  });

  console.log(`Seeded admin user ${email}`);
}

main()
  .catch((err) => {
    console.error('E2E seed failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
