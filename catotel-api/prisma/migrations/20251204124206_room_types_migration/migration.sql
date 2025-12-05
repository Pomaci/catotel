-- Replace per-room pricing with room types and connect rooms/reservations to them.

-- Drop old FK/index using roomId before we reshape the schema.
ALTER TABLE "public"."Reservation" DROP CONSTRAINT IF EXISTS "Reservation_roomId_fkey";
DROP INDEX IF EXISTS "public"."Reservation_roomId_idx";
DROP INDEX IF EXISTS "public"."Room_type_idx";

-- 1) Create room types table.
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "nightlyRate" DECIMAL(7,2) NOT NULL,
    "amenities" JSONB,
    "overbookingLimit" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- 2) Add nullable FK columns so we can backfill existing rows.
ALTER TABLE "Room" ADD COLUMN "roomTypeId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "roomTypeId" TEXT;

-- 3) Seed one RoomType per existing room to keep data valid.
INSERT INTO "RoomType" ("id","name","description","capacity","nightlyRate","amenities","overbookingLimit","isActive","createdAt","updatedAt")
SELECT "id" || '_type',
       "name" || ' Type',
       "description",
       COALESCE("capacity", 1),
       COALESCE("nightlyRate", 0),
       "amenities",
       COALESCE("overbookingLimit", 0),
       "isActive",
       NOW(),
       NOW()
FROM "Room";

-- 4) Link rooms and reservations to the generated room types.
UPDATE "Room" SET "roomTypeId" = "id" || '_type';
UPDATE "Reservation" r
SET "roomTypeId" = rm."id" || '_type'
FROM "Room" rm
WHERE r."roomId" = rm."id";

-- 5) Enforce NOT NULL and foreign keys.
ALTER TABLE "Room" ALTER COLUMN "roomTypeId" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "roomTypeId" SET NOT NULL;
ALTER TABLE "Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6) Drop legacy columns now that room types hold pricing/stock data.
ALTER TABLE "Room" DROP COLUMN "amenities",
DROP COLUMN "capacity",
DROP COLUMN "nightlyRate",
DROP COLUMN "overbookingLimit",
DROP COLUMN "stock",
DROP COLUMN "type";
ALTER TABLE "Reservation" DROP COLUMN "roomId";

-- 7) Add supporting indexes.
CREATE UNIQUE INDEX "RoomType_name_key" ON "RoomType"("name");
CREATE INDEX "Reservation_roomTypeId_idx" ON "Reservation"("roomTypeId");
CREATE INDEX "Room_roomTypeId_idx" ON "Room"("roomTypeId");
