-- Drop default processed timestamp; keep nullable
ALTER TABLE "Payment" ALTER COLUMN "processedAt" DROP DEFAULT;

-- Clear processedAt for payments that are still pending
UPDATE "Payment" SET "processedAt" = NULL WHERE "status" = 'PENDING';
