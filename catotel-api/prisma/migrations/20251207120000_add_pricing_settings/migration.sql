-- Align updatedAt defaults with application logic
ALTER TABLE "PricingSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;
