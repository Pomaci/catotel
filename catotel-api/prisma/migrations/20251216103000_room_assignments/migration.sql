-- CreateTable
CREATE TABLE "RoomAssignment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "catCount" INTEGER NOT NULL,
    "allowRoomSharing" BOOLEAN NOT NULL DEFAULT true,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAssignmentCat" (
    "assignmentId" TEXT NOT NULL,
    "catId" TEXT NOT NULL,

    CONSTRAINT "RoomAssignmentCat_pkey" PRIMARY KEY ("assignmentId","catId")
);

-- CreateIndex
CREATE INDEX "RoomAssignment_roomId_idx" ON "RoomAssignment"("roomId");

-- CreateIndex
CREATE INDEX "RoomAssignment_reservationId_idx" ON "RoomAssignment"("reservationId");

-- CreateIndex
CREATE INDEX "RoomAssignment_checkIn_checkOut_idx" ON "RoomAssignment"("checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "RoomAssignmentCat_catId_idx" ON "RoomAssignmentCat"("catId");

-- AddForeignKey
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAssignmentCat" ADD CONSTRAINT "RoomAssignmentCat_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "RoomAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAssignmentCat" ADD CONSTRAINT "RoomAssignmentCat_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Cat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
