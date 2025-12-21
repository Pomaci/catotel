-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "overbookingLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Standart';

-- CreateIndex
CREATE INDEX "Room_type_idx" ON "Room"("type");
