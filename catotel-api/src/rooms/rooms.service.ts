import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BadRequestException } from '@nestjs/common';
import { startOfDay } from 'date-fns';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.room.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async listWithAvailability(
    checkIn: string,
    checkOut: string,
    activeOnly = true,
  ) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) {
      throw new BadRequestException('checkOut must be after checkIn');
    }
    if (start < startOfDay(new Date())) {
      throw new BadRequestException('checkIn cannot be in the past');
    }

    const rooms = await this.prisma.room.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
    if (!rooms.length) return [];

    const overlaps = await this.prisma.reservation.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      select: { roomId: true },
    });
    const busy = new Set(overlaps.map((r) => r.roomId));

    return rooms.map((room) => ({
      ...room,
      available: !busy.has(room.id),
    }));
  }

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        nightlyRate: new Prisma.Decimal(dto.nightlyRate),
        amenities: dto.amenities,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateRoomDto) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Room not found');
    }
    const { nightlyRate, ...rest } = dto;
    return this.prisma.room.update({
      where: { id },
      data: {
        ...rest,
        ...(nightlyRate !== undefined
          ? { nightlyRate: new Prisma.Decimal(nightlyRate) }
          : {}),
      },
    });
  }
}
