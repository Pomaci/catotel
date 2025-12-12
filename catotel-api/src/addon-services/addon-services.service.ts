import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateAddonServiceDto,
  UpdateAddonServiceDto,
} from './dto/addon-service.dto';

@Injectable()
export class AddonServicesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.addonService.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listAll() {
    return this.prisma.addonService.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateAddonServiceDto) {
    const payload = this.buildCreatePayload(dto);
    return this.prisma.addonService.create({ data: payload });
  }

  async update(id: string, dto: UpdateAddonServiceDto) {
    const payload = this.buildUpdatePayload(dto);
    try {
      return await this.prisma.addonService.update({
        where: { id },
        data: payload,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Addon service not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.addonService.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Addon service not found');
      }
      throw error;
    }
  }

  private buildCreatePayload(dto: CreateAddonServiceDto) {
    return {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      price: new Prisma.Decimal(dto.price),
      isActive: dto.isActive ?? true,
    };
  }

  private buildUpdatePayload(dto: UpdateAddonServiceDto) {
    const payload: Prisma.AddonServiceUpdateInput = {};
    if (typeof dto.name === 'string') {
      payload.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      payload.description = dto.description?.trim() || null;
    }
    if (typeof dto.price === 'number') {
      payload.price = new Prisma.Decimal(dto.price);
    }
    if (typeof dto.isActive === 'boolean') {
      payload.isActive = dto.isActive;
    }
    return payload;
  }
}
