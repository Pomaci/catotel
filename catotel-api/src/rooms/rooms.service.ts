import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.room.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: {
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        nightlyRate: dto.nightlyRate,
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
    return this.prisma.room.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }
}
