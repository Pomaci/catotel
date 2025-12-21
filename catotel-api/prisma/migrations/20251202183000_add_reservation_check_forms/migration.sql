-- Add check-in / check-out operational form fields to reservations
ALTER TABLE "Reservation"
  ADD COLUMN "checkedInAt" TIMESTAMP(3),
  ADD COLUMN "checkedOutAt" TIMESTAMP(3),
  ADD COLUMN "checkInForm" JSONB,
  ADD COLUMN "checkOutForm" JSONB;
