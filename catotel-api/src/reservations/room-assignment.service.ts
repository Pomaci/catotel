import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StructuredLogger } from 'src/common/logger/structured-logger';
import {
  localizedError,
  ERROR_CODES,
} from 'src/common/errors/localized-error.util';

type Allocation = {
  reservationId: string;
  customerId: string;
  allowRoomSharing: boolean;
  catCount: number;
  checkIn: Date;
  checkOut: Date;
  locked: boolean;
};

type RoomState = {
  id: string;
  capacity: number;
  allocations: Allocation[];
};

type AssignmentCandidate = {
  reservationId: string;
  customerId: string;
  catIds: string[];
  catCount: number;
  allowRoomSharing: boolean;
  checkIn: Date;
  checkOut: Date;
};

@Injectable()
export class RoomAssignmentService {
  private readonly logger = new StructuredLogger(RoomAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async rebalanceRoomType(
    roomTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = (tx ?? this.prisma) as PrismaService | Prisma.TransactionClient;
    const roomType = await client.roomType.findUnique({
      where: { id: roomTypeId },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!roomType || !roomType.isActive) {
      return;
    }
    if (!roomType.rooms.length) {
      this.logger.warn('Room type has no active rooms; skipping assignment', {
        roomTypeId,
      });
      return;
    }

    await client.roomAssignment.deleteMany({
      where: {
        reservation: {
          roomTypeId,
          status: { in: [ReservationStatus.CANCELLED, ReservationStatus.CHECKED_OUT] },
        },
      },
    });

    const reservations = await client.reservation.findMany({
      where: {
        roomTypeId,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
          ],
        },
      },
      orderBy: { checkIn: 'asc' },
      include: {
        cats: { select: { catId: true } },
        roomAssignments: true,
      },
    });
    if (!reservations.length) {
      await client.roomAssignment.deleteMany({
        where: {
          room: { roomTypeId },
        },
      });
      return;
    }

    const capacity = Math.max(roomType.capacity || 1, 1);
    const roomStates = roomType.rooms.map<RoomState>((room) => ({
      id: room.id,
      capacity,
      allocations: [],
    }));
    const roomStateMap = new Map(roomStates.map((state) => [state.id, state]));
    const assignmentsToDelete: string[] = [];
    const candidates: AssignmentCandidate[] = [];

    for (const reservation of reservations) {
      const catIds = reservation.cats.map((cat) => cat.catId);
      const catCount = Math.max(catIds.length, 1);
      if (catCount > capacity) {
        throw new BadRequestException(
          localizedError(ERROR_CODES.RESERVATION_ROOM_ASSIGNMENT_CAPACITY),
        );
      }
      const allowRoomSharing =
        reservation.allowRoomSharing === undefined
          ? true
          : reservation.allowRoomSharing;
      const currentAssignments = reservation.roomAssignments;
      const existingAssignment = currentAssignments[0];
      const isLocked =
        reservation.status === ReservationStatus.CHECKED_IN ||
        Boolean(existingAssignment?.lockedAt);

      if (existingAssignment && !roomStateMap.has(existingAssignment.roomId)) {
        assignmentsToDelete.push(existingAssignment.id);
        continue;
      }

      if (existingAssignment && isLocked) {
        const room = roomStateMap.get(existingAssignment.roomId);
        if (room) {
          room.allocations.push({
            reservationId: reservation.id,
            customerId: reservation.customerId,
            allowRoomSharing: existingAssignment.allowRoomSharing,
            catCount: existingAssignment.catCount,
            checkIn: existingAssignment.checkIn,
            checkOut: existingAssignment.checkOut,
            locked: true,
          });
        }
        continue;
      }

      if (existingAssignment) {
        assignmentsToDelete.push(existingAssignment.id);
      }

      candidates.push({
        reservationId: reservation.id,
        customerId: reservation.customerId,
        catIds,
        catCount,
        allowRoomSharing,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
      });
    }

    if (assignmentsToDelete.length) {
      await client.roomAssignment.deleteMany({
        where: { id: { in: assignmentsToDelete } },
      });
    }

    candidates.sort((a, b) => {
      if (a.allowRoomSharing !== b.allowRoomSharing) {
        return a.allowRoomSharing ? 1 : -1;
      }
      if (b.catCount !== a.catCount) {
        return b.catCount - a.catCount;
      }
      return a.checkIn.getTime() - b.checkIn.getTime();
    });

    const plan: Array<
      AssignmentCandidate & { roomId: string }
    > = [];

    for (const candidate of candidates) {
      const preferredRooms = this.findPreferredRooms(
        roomStates,
        candidate,
      );
      const orderedRooms = preferredRooms.length
        ? [
            ...preferredRooms,
            ...roomStates.filter(
              (room) => !preferredRooms.some((preferred) => preferred.id === room.id),
            ),
          ]
        : [...roomStates];

      let assignedRoom: RoomState | null = null;
      let assignedFit: { fits: boolean; wastedCapacity: number } | null = null;

      for (const room of orderedRooms) {
        const fit = this.canFit(room, candidate);
        if (!fit.fits) continue;
        if (
          !assignedRoom ||
          fit.wastedCapacity < (assignedFit?.wastedCapacity ?? Number.MAX_SAFE_INTEGER)
        ) {
          assignedRoom = room;
          assignedFit = fit;
        }
      }

      if (!assignedRoom) {
        throw new BadRequestException(
          localizedError(ERROR_CODES.RESERVATION_ROOM_ASSIGNMENT_NO_ROOM),
        );
      }

      assignedRoom.allocations.push({
        reservationId: candidate.reservationId,
        customerId: candidate.customerId,
        allowRoomSharing: candidate.allowRoomSharing,
        catCount: candidate.catCount,
        checkIn: candidate.checkIn,
        checkOut: candidate.checkOut,
        locked: false,
      });
      plan.push({ ...candidate, roomId: assignedRoom.id });
    }

    for (const entry of plan) {
      await client.roomAssignment.create({
        data: {
          reservationId: entry.reservationId,
          roomId: entry.roomId,
          checkIn: entry.checkIn,
          checkOut: entry.checkOut,
          catCount: entry.catCount,
          allowRoomSharing: entry.allowRoomSharing,
          cats: entry.catIds.length
            ? {
                createMany: {
                  data: entry.catIds.map((catId) => ({ catId })),
                  skipDuplicates: true,
                },
              }
            : undefined,
        },
      });
    }
  }

  async lockAssignmentsForReservation(
    reservationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = (tx ?? this.prisma) as PrismaService | Prisma.TransactionClient;
    await client.roomAssignment.updateMany({
      where: { reservationId },
      data: { lockedAt: new Date() },
    });
  }

  private findPreferredRooms(roomStates: RoomState[], candidate: AssignmentCandidate) {
    const overlappingRooms = roomStates.filter((room) =>
      room.allocations.some(
        (allocation) =>
          allocation.customerId === candidate.customerId &&
          this.overlaps(allocation, candidate),
      ),
    );
    if (overlappingRooms.length) {
      return overlappingRooms;
    }
    return [];
  }

  private canFit(room: RoomState, candidate: AssignmentCandidate) {
    const overlaps = room.allocations.filter((allocation) =>
      this.overlaps(allocation, candidate),
    );
    if (!candidate.allowRoomSharing) {
      return {
        fits: overlaps.length === 0,
        wastedCapacity: overlaps.length === 0
          ? Math.max(room.capacity - candidate.catCount, 0)
          : Number.MAX_SAFE_INTEGER,
      };
    }
    if (overlaps.some((allocation) => !allocation.allowRoomSharing)) {
      return { fits: false, wastedCapacity: Number.MAX_SAFE_INTEGER };
    }
    const checkpoints = new Set<number>([
      candidate.checkIn.getTime(),
      candidate.checkOut.getTime(),
    ]);
    for (const allocation of overlaps) {
      checkpoints.add(allocation.checkIn.getTime());
      checkpoints.add(allocation.checkOut.getTime());
    }
    const timeline = Array.from(checkpoints).sort((a, b) => a - b);
    let peakLoad = candidate.catCount;
    for (let i = 0; i < timeline.length - 1; i++) {
      const start = timeline[i];
      const end = timeline[i + 1];
      if (end <= start) continue;
      if (end <= candidate.checkIn.getTime()) continue;
      if (start >= candidate.checkOut.getTime()) continue;
      const load =
        overlaps.reduce((sum, allocation) => {
          if (
            allocation.checkIn.getTime() < end &&
            allocation.checkOut.getTime() > start
          ) {
            return sum + allocation.catCount;
          }
          return sum;
        }, 0) + candidate.catCount;
      peakLoad = Math.max(peakLoad, load);
      if (load > room.capacity) {
        return { fits: false, wastedCapacity: Number.MAX_SAFE_INTEGER };
      }
    }
    return {
      fits: peakLoad <= room.capacity,
      wastedCapacity: Math.max(room.capacity - peakLoad, 0),
    };
  }

  private overlaps(a: Allocation, b: Allocation | AssignmentCandidate) {
    return a.checkIn < b.checkOut && a.checkOut > b.checkIn;
  }
}
