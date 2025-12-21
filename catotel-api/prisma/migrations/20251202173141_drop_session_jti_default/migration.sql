-- Drop legacy default value so Prisma generates one per session
ALTER TABLE "Session" ALTER COLUMN "jti" DROP DEFAULT;
