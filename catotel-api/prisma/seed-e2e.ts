import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';
import { StructuredLogger } from '../src/common/logger/structured-logger';

const prisma = new PrismaClient();
const seedLogger = new StructuredLogger('E2ESeed');

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

  seedLogger.log('Seeded admin user', { email });
}

main()
  .catch((err) => {
    seedLogger.error(
      'E2E seed failed',
      { error: err instanceof Error ? err.message : String(err) },
      err instanceof Error ? err.stack : undefined,
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
