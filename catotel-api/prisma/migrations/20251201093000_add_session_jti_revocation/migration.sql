-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add jti column and backfill existing sessions
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "jti" TEXT;
UPDATE "Session" SET "jti" = gen_random_uuid() WHERE "jti" IS NULL;
ALTER TABLE "Session" ALTER COLUMN "jti" SET DEFAULT gen_random_uuid();
ALTER TABLE "Session" ALTER COLUMN "jti" SET NOT NULL;

-- Add revocation metadata
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;

-- Ensure unique constraint on jti
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Session_jti_key'
  ) THEN
    CREATE UNIQUE INDEX "Session_jti_key" ON "Session"("jti");
  END IF;
END;
$$;
