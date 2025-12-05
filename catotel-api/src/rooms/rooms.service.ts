import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeInactive = false) {
    return this.prisma.room.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
      include: { roomType: true },
    });
  }

  async create(dto: CreateRoomDto) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: dto.roomTypeId },
    });
    if (!roomType || !roomType.isActive) {
      throw new BadRequestException('Room type not found or inactive');
    }
    return this.prisma.room.create({
      data: {
        name: dto.name,
        description: dto.description,
        roomTypeId: dto.roomTypeId,
        isActive: dto.isActive ?? true,
      },
      include: { roomType: true },
    });
  }

  async update(id: string, dto: UpdateRoomDto) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Room not found');
    }

    if (dto.roomTypeId) {
      const targetType = await this.prisma.roomType.findUnique({
        where: { id: dto.roomTypeId },
      });
      if (!targetType || !targetType.isActive) {
        throw new BadRequestException('Room type not found or inactive');
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        roomTypeId: dto.roomTypeId,
        ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
      },
      include: { roomType: true },
    });
  }
}
