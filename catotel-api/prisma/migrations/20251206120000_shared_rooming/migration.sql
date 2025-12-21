-- Add room sharing preference and reserved slot tracking to reservations
ALTER TABLE "Reservation"
ADD COLUMN "allowRoomSharing" BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN "reservedSlots" INTEGER NOT NULL DEFAULT 0;
