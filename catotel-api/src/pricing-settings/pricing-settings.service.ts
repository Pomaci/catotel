import { Injectable } from '@nestjs/common';
import { Prisma, PricingSettings } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  LegacyLongStayDiscountDto,
  LongStayDiscountTierDto,
  MultiCatDiscountTierDto,
  PricingSettingsResponseDto,
  SharedRoomDiscountTierDto,
  UpdatePricingSettingsDto,
} from './dto/pricing-settings.dto';

type MultiCatTierPayload = {
  catCount: number;
  discountPercent: number;
};

type SharedRoomTierPayload = {
  remainingCapacity: number;
  discountPercent: number;
};

type LongStayTierPayload = {
  minNights: number;
  discountPercent: number;
};

type LegacyLongStayPayload = {
  enabled: boolean;
  minNights: number;
  discountPercent: number;
};

@Injectable()
export class PricingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<PricingSettingsResponseDto | null> {
    const record = await this.prisma.pricingSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return record ? this.toResponse(record) : null;
  }

  async updateSettings(
    dto: UpdatePricingSettingsDto,
  ): Promise<PricingSettingsResponseDto> {
    const data = this.buildPersistencePayload(dto);
    const existing = await this.prisma.pricingSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const saved = existing
      ? await this.prisma.pricingSettings.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.pricingSettings.create({ data });

    return this.toResponse(saved);
  }

  private buildPersistencePayload(
    dto: UpdatePricingSettingsDto,
  ): Prisma.PricingSettingsUncheckedCreateInput &
    Prisma.PricingSettingsUncheckedUpdateInput {
    const multiCatDiscounts = this.normalizeMultiCatDiscounts(
      dto.multiCatDiscounts,
    );
    const sharedRoomDiscounts = this.normalizeSharedRoomDiscounts(
      dto.sharedRoomDiscounts,
    );
    const longStayDiscounts = this.normalizeLongStayDiscounts(
      dto.longStayDiscounts,
    );
    const legacyLongStay = this.normalizeLegacyLongStay(dto.longStayDiscount);
    const longStayEnabled =
      dto.longStayDiscountEnabled ??
      (typeof dto.longStayDiscount?.enabled === 'boolean'
        ? dto.longStayDiscount.enabled
        : false);

    return {
      multiCatDiscountEnabled: dto.multiCatDiscountEnabled ?? false,
      multiCatDiscounts:
        multiCatDiscounts === undefined ? Prisma.DbNull : multiCatDiscounts,
      sharedRoomDiscountEnabled: dto.sharedRoomDiscountEnabled ?? false,
      sharedRoomDiscountPercent:
        dto.sharedRoomDiscountPercent === undefined
          ? null
          : dto.sharedRoomDiscountPercent,
      sharedRoomDiscounts:
        sharedRoomDiscounts === undefined ? Prisma.DbNull : sharedRoomDiscounts,
      longStayDiscountEnabled: longStayEnabled,
      longStayDiscounts:
        longStayDiscounts === undefined ? Prisma.DbNull : longStayDiscounts,
      longStayDiscount:
        legacyLongStay === undefined
          ? Prisma.DbNull
          : (legacyLongStay ?? Prisma.DbNull),
    };
  }

  private normalizeMultiCatDiscounts(
    discounts?: MultiCatDiscountTierDto[],
  ): MultiCatTierPayload[] | undefined {
    if (discounts === undefined) return undefined;
    const tiers = new Map<number, number>();
    discounts.forEach((tier) => {
      const catCount = Math.max(1, Math.trunc(Number(tier.catCount)));
      const discount = Number(tier.discountPercent);
      if (Number.isFinite(catCount) && Number.isFinite(discount)) {
        tiers.set(catCount, discount);
      }
    });
    return Array.from(tiers.entries())
      .map(([catCount, discountPercent]) => ({
        catCount,
        discountPercent,
      }))
      .sort((a, b) => a.catCount - b.catCount);
  }

  private normalizeSharedRoomDiscounts(
    discounts?: SharedRoomDiscountTierDto[],
  ): SharedRoomTierPayload[] | undefined {
    if (discounts === undefined) return undefined;
    const tiers = new Map<number, number>();
    discounts.forEach((tier) => {
      const remainingCapacity = Math.max(
        0,
        Math.trunc(Number(tier.remainingCapacity)),
      );
      const discount = Number(tier.discountPercent);
      if (Number.isFinite(remainingCapacity) && Number.isFinite(discount)) {
        tiers.set(remainingCapacity, discount);
      }
    });
    return Array.from(tiers.entries())
      .map(([remainingCapacity, discountPercent]) => ({
        remainingCapacity,
        discountPercent,
      }))
      .sort((a, b) => a.remainingCapacity - b.remainingCapacity);
  }

  private normalizeLongStayDiscounts(
    discounts?: LongStayDiscountTierDto[],
  ): LongStayTierPayload[] | undefined {
    if (discounts === undefined) return undefined;
    const tiers = new Map<number, number>();
    discounts.forEach((tier) => {
      const minNights = Math.max(1, Math.trunc(Number(tier.minNights)));
      const discount = Number(tier.discountPercent);
      if (Number.isFinite(minNights) && Number.isFinite(discount)) {
        tiers.set(minNights, discount);
      }
    });
    return Array.from(tiers.entries())
      .map(([minNights, discountPercent]) => ({
        minNights,
        discountPercent,
      }))
      .sort((a, b) => a.minNights - b.minNights);
  }

  private toResponse(record: PricingSettings): PricingSettingsResponseDto {
    const sharedPercent = record.sharedRoomDiscountPercent
      ? Number(record.sharedRoomDiscountPercent)
      : record.sharedRoomDiscountPercent;
    const multiCatDiscounts = this.parseJsonArray<MultiCatTierPayload>(
      record.multiCatDiscounts,
    );
    const sharedRoomDiscounts =
      this.parseJsonArray<SharedRoomTierPayload>(record.sharedRoomDiscounts) ??
      undefined;
    const longStayDiscounts = this.parseJsonArray<LongStayTierPayload>(
      record.longStayDiscounts,
    );
    const legacyLongStay =
      this.parseJsonObject<LegacyLongStayPayload>(record.longStayDiscount) ??
      null;
    const resolvedSharedPercent =
      typeof sharedPercent === 'number'
        ? sharedPercent
        : (sharedRoomDiscounts?.[0]?.discountPercent ?? null);

    return {
      multiCatDiscountEnabled: record.multiCatDiscountEnabled,
      multiCatDiscounts,
      sharedRoomDiscountEnabled: record.sharedRoomDiscountEnabled,
      sharedRoomDiscountPercent: resolvedSharedPercent,
      sharedRoomDiscounts,
      longStayDiscountEnabled:
        record.longStayDiscountEnabled ??
        (legacyLongStay ? legacyLongStay.enabled : false),
      longStayDiscounts,
      longStayDiscount: legacyLongStay,
    };
  }

  private parseJsonArray<T>(value: Prisma.JsonValue | null): T[] | undefined {
    if (value === null || !Array.isArray(value)) {
      return undefined;
    }
    return value.map((entry) => entry as T);
  }

  private parseJsonObject<T>(value: Prisma.JsonValue | null): T | null {
    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }
    return value as T;
  }

  private normalizeLegacyLongStay(
    discount?: LegacyLongStayDiscountDto | null,
  ): LegacyLongStayPayload | null | undefined {
    if (discount === undefined) return undefined;
    if (!discount) return null;
    return {
      enabled: Boolean(discount.enabled),
      minNights: Math.max(1, Math.trunc(Number(discount.minNights))),
      discountPercent: Number(discount.discountPercent),
    };
  }
}
