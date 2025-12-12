import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(activeOnly = true) {
    const roomTypes = await this.prisma.roomType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
      include: {
        rooms: { where: { isActive: true }, select: { id: true } },
      },
    });
    return roomTypes.map((roomType) => {
      const { rooms, ...rest } = roomType;
      return {
        ...rest,
        totalUnits: rooms.length,
      };
    });
  }

  async listWithAvailability(
    checkIn: string,
    checkOut: string,
    activeOnly = true,
    partySize?: number,
  ) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) {
      throw new BadRequestException('checkOut must be after checkIn');
    }
    if (start < startOfDay(new Date())) {
      throw new BadRequestException('checkIn cannot be in the past');
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
      include: {
        rooms: { where: { isActive: true }, select: { id: true } },
      },
    });
    if (!roomTypes.length) return [];

    const roomTypeCapacityMap = new Map(
      roomTypes.map((rt) => [rt.id, rt.capacity || 1]),
    );
    const overlaps = await this.prisma.reservation.findMany({
      where: {
        roomTypeId: { in: roomTypes.map((r) => r.id) },
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
          ],
        },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      select: {
        roomTypeId: true,
        reservedSlots: true,
        allowRoomSharing: true,
        _count: { select: { cats: true } },
      },
    });
    const overlapMap = new Map<string, number>();
    overlaps.forEach((overlap) => {
      const capacity = roomTypeCapacityMap.get(overlap.roomTypeId) ?? 1;
      const prev = overlapMap.get(overlap.roomTypeId) ?? 0;
      overlapMap.set(
        overlap.roomTypeId,
        prev + this.resolveReservationSlots(overlap, capacity),
      );
    });

    return roomTypes.map((roomType) => {
      const { rooms, ...rest } = roomType;
      const baseUnits = rooms.length;
      const totalSlots =
        (baseUnits + rest.overbookingLimit) * (rest.capacity || 1);
      const takenSlots = overlapMap.get(roomType.id) ?? 0;
      const availableSlots = Math.max(0, totalSlots - takenSlots);
      const availableUnits = Math.floor(availableSlots / (rest.capacity || 1));
      const capacityOk = partySize ? availableSlots >= partySize : true;
      return {
        ...rest,
        totalUnits: baseUnits,
        availableUnits: capacityOk ? availableUnits : 0,
        availableSlots,
        capacityOk,
        available: capacityOk && availableSlots > 0,
      };
    });
  }

  create(dto: CreateRoomTypeDto) {
    return this.prisma.roomType.create({
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        nightlyRate: new Prisma.Decimal(dto.nightlyRate),
        overbookingLimit: Math.max(0, dto.overbookingLimit ?? 0),
        amenities: dto.amenities,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateRoomTypeDto) {
    const existing = await this.prisma.roomType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Room type not found');
    }
    const { nightlyRate, overbookingLimit, ...rest } = dto;
    return this.prisma.roomType.update({
      where: { id },
      data: {
        ...rest,
        ...(overbookingLimit !== undefined
          ? { overbookingLimit: Math.max(0, overbookingLimit) }
          : {}),
        ...(nightlyRate !== undefined
          ? { nightlyRate: new Prisma.Decimal(nightlyRate) }
          : {}),
      },
    });
  }

  private resolveReservationSlots(
    reservation: {
      reservedSlots: number | null;
      allowRoomSharing: boolean | null;
      _count?: { cats: number };
    },
    capacity: number,
  ) {
    const normalizedCapacity = Math.max(1, capacity);
    if (reservation.reservedSlots && reservation.reservedSlots > 0) {
      return Math.min(reservation.reservedSlots, normalizedCapacity);
    }
    if (reservation.allowRoomSharing === false) {
      return normalizedCapacity;
    }
    const catCount = reservation._count?.cats ?? 0;
    if (catCount > 0) {
      return Math.min(catCount, normalizedCapacity);
    }
    return normalizedCapacity;
  }
}
