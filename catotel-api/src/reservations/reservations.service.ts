import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ReservationStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { randomBytes } from 'crypto';
import { publicUserSelect } from 'src/user/public-user.select';
import { RoomAssignmentService } from './room-assignment.service';
import { PricingSettingsService } from 'src/pricing-settings/pricing-settings.service';
import { PricingSettingsResponseDto } from 'src/pricing-settings/dto/pricing-settings.dto';
import {
  differenceInHotelNights,
  parseHotelDayInput,
  startOfUtcDay,
} from 'src/common/hotel-day.util';
import {
  localizedError,
  ERROR_CODES,
} from 'src/common/errors/localized-error.util';

type NormalizedMultiCatTier = { catCount: number; discountPercent: number };
type NormalizedSharedRoomTier = {
  remainingCapacity: number;
  discountPercent: number;
};
type NormalizedLongStayTier = { minNights: number; discountPercent: number };

type NormalizedPricingSettings = {
  multiCatDiscountEnabled: boolean;
  multiCatDiscounts: NormalizedMultiCatTier[];
  sharedRoomDiscountEnabled: boolean;
  sharedRoomDiscounts: NormalizedSharedRoomTier[];
  longStayDiscountEnabled: boolean;
  longStayDiscounts: NormalizedLongStayTier[];
};

type LegacyRoomSelectionPayload = { roomId?: string | null };

type ReservationStatusPayload = { status?: ReservationStatus | null };

const hasLegacyRoomSelection = (
  payload: unknown,
): payload is LegacyRoomSelectionPayload => {
  return typeof payload === 'object' && payload !== null && 'roomId' in payload;
};

const hasReservationStatusPayload = (
  payload: unknown,
): payload is ReservationStatusPayload => {
  return typeof payload === 'object' && payload !== null && 'status' in payload;
};

const getLegacyRoomTypeId = (payload: unknown): string | undefined => {
  if (!hasLegacyRoomSelection(payload)) {
    return undefined;
  }
  const value = payload.roomId;
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getStatusFromPayload = (
  payload: unknown,
): ReservationStatus | undefined => {
  if (!hasReservationStatusPayload(payload)) {
    return undefined;
  }
  return payload.status ?? undefined;
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomAssignmentService: RoomAssignmentService,
    private readonly pricingSettings: PricingSettingsService,
  ) {}

  private readonly reservationInclude = {
    roomType: true,
    customer: { include: { user: { select: publicUserSelect } } },
    cats: { include: { cat: true } },
    services: { include: { service: true } },
    roomAssignments: {
      include: {
        room: true,
        cats: { include: { cat: true } },
      },
    },
  } as const;

  private readonly reservationIncludeWithPayments = {
    ...this.reservationInclude,
    payments: true,
  } as const;

  async list(userId: string, role: UserRole, status?: ReservationStatus) {
    const where: Prisma.ReservationWhereInput =
      role === UserRole.CUSTOMER
        ? { customer: { userId } }
        : status
          ? { status }
          : {};
    return this.prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.reservationInclude,
    });
  }

  async getById(id: string, userId: string, role: UserRole) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: this.reservationIncludeWithPayments,
    });
    if (!reservation) {
      throw new NotFoundException(
        localizedError(ERROR_CODES.RESERVATION_NOT_FOUND),
      );
    }
    if (role === UserRole.CUSTOMER && reservation.customer.userId !== userId) {
      throw new ForbiddenException(
        localizedError(ERROR_CODES.RESERVATION_FORBIDDEN_VIEW),
      );
    }
    return reservation;
  }

  async create(userId: string, role: UserRole, dto: CreateReservationDto) {
    const targetCustomer = await this.resolveCustomer(
      userId,
      role,
      dto.customerId,
    );
    const roomTypeId = dto.roomTypeId ?? getLegacyRoomTypeId(dto);
    if (!roomTypeId) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_ROOM_TYPE_REQUIRED),
      );
    }

    const checkIn = parseHotelDayInput(dto.checkIn, 'checkIn');
    const checkOut = parseHotelDayInput(dto.checkOut, 'checkOut');
    if (checkIn >= checkOut) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_INVALID_DATE_RANGE),
      );
    }
    const isCheckInDateFromPayload = 'checkIn' in dto;
    const statusFromPayload = getStatusFromPayload(dto);
    const isStatusCheckIn = statusFromPayload === ReservationStatus.CHECKED_IN;
    if (
      isCheckInDateFromPayload &&
      !isStatusCheckIn &&
      checkIn < startOfUtcDay(new Date())
    ) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_CHECKIN_IN_PAST),
      );
    }

    const cats = await this.prisma.cat.findMany({
      where: { id: { in: dto.catIds } },
    });
    if (cats.length !== dto.catIds.length) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_CATS_NOT_FOUND),
      );
    }
    for (const cat of cats) {
      if (cat.customerId !== targetCustomer.id) {
        throw new ForbiddenException(
          localizedError(ERROR_CODES.RESERVATION_CAT_NOT_OWNED, {
            catName: cat.name,
          }),
        );
      }
    }
    await this.ensureCatsAvailable(dto.catIds, checkIn, checkOut);

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!roomType || !roomType.isActive) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_ROOM_TYPE_NOT_AVAILABLE),
      );
    }
    if (roomType.capacity < cats.length) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_ROOM_CAPACITY_EXCEEDED),
      );
    }

    const activeRoomCount = await this.getActiveRoomCount(roomType.id);
    if (activeRoomCount <= 0) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_NO_ACTIVE_ROOMS),
      );
    }

    const allowRoomSharing =
      dto.allowRoomSharing === undefined ? true : !!dto.allowRoomSharing;
    const requiredSlots = allowRoomSharing ? cats.length : roomType.capacity;

    await this.assertRoomTypeAvailability(
      roomType,
      checkIn,
      checkOut,
      requiredSlots,
    );

    let nights = differenceInHotelNights(checkOut, checkIn);
    if (nights <= 0) {
      nights = 1;
    }
    const normalizedPricing = this.normalizePricingSettings(
      await this.pricingSettings.getSettings(),
    );

    const addons =
      dto.addons && dto.addons.length
        ? await this.prisma.addonService.findMany({
            where: { id: { in: dto.addons.map((a) => a.serviceId) } },
          })
        : [];
    const reservationServices: {
      serviceId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }[] = [];
    if (addons.length) {
      for (const addon of addons) {
        const requested = dto.addons!.find((a) => a.serviceId === addon.id)!;
        reservationServices.push({
          serviceId: addon.id,
          quantity: requested.quantity,
          unitPrice: addon.price,
        });
      }
    }

    const persistReservation = (code: string) =>
      this.prisma.$transaction(
        async (tx) => {
          const freshRoomType = await tx.roomType.findUnique({
            where: { id: roomType.id },
          });
          if (!freshRoomType || !freshRoomType.isActive) {
            throw new BadRequestException(
              localizedError(ERROR_CODES.RESERVATION_ROOM_TYPE_NOT_AVAILABLE),
            );
          }
          if (freshRoomType.capacity < cats.length) {
            throw new BadRequestException(
              localizedError(ERROR_CODES.RESERVATION_ROOM_CAPACITY_EXCEEDED),
            );
          }

          await this.assertRoomTypeAvailability(
            freshRoomType,
            checkIn,
            checkOut,
            requiredSlots,
            undefined,
            tx,
          );
          const totalPrice = this.calculateTotalPrice(
            freshRoomType.nightlyRate,
            nights,
            reservationServices,
            {
              capacity: freshRoomType.capacity,
              catCount: cats.length,
              allowRoomSharing,
            },
            normalizedPricing,
          );

          const created = await tx.reservation.create({
            data: {
              code,
              customerId: targetCustomer.id,
              roomTypeId: freshRoomType.id,
              checkIn,
              checkOut,
              totalPrice,
              specialRequests: dto.specialRequests,
              allowRoomSharing,
              reservedSlots: requiredSlots,
              cats: {
                createMany: {
                  data: dto.catIds.map((catId) => ({ catId })),
                },
              },
              services: reservationServices.length
                ? {
                    createMany: {
                      data: reservationServices,
                    },
                  }
                : undefined,
            },
          });

          await this.roomAssignmentService.rebalanceRoomType(
            freshRoomType.id,
            tx,
          );

          return tx.reservation.findUniqueOrThrow({
            where: { id: created.id },
            include: this.reservationInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

    const maxCodeAttempts = 10;
    for (let attempt = 0; attempt < maxCodeAttempts; attempt++) {
      const code = this.generateReservationCode(attempt);
      try {
        return await persistReservation(code);
      } catch (error) {
        if (
          this.isReservationCodeCollision(error) &&
          attempt < maxCodeAttempts - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Unable to generate unique reservation code');
  }

  private async resolveCustomer(
    userId: string,
    role: UserRole,
    customerId?: string,
  ) {
    if (role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });
      if (!customer) {
        throw new BadRequestException(
          localizedError(ERROR_CODES.CUSTOMER_PROFILE_NOT_FOUND),
        );
      }
      return customer;
    }

    if (!customerId) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_CUSTOMER_ID_REQUIRED),
      );
    }

    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(
        localizedError(ERROR_CODES.CUSTOMER_NOT_FOUND),
      );
    }
    return customer;
  }

  private generateReservationCode(attempt: number) {
    const baseBytes = 3;
    const maxBytes = 8;
    const byteLength = Math.min(
      maxBytes,
      baseBytes + Math.floor(attempt / 2),
    );
    // Expand the random space as we retry to keep collision probability negligible.
    return `CAT-${randomBytes(byteLength).toString('hex').toUpperCase()}`;
  }

  private isReservationCodeCollision(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      if (typeof target === 'string') {
        return target.includes('Reservation_code');
      }
      if (Array.isArray(target)) {
        return target.some(
          (value) =>
            typeof value === 'string' && value.includes('Reservation_code'),
        );
      }
    }
    return false;
  }

  async update(id: string, role: UserRole, dto: UpdateReservationDto) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { cats: true, roomType: true },
    });
    if (!existing) {
      throw new NotFoundException(
        localizedError(ERROR_CODES.RESERVATION_NOT_FOUND),
      );
    }
    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER &&
      role !== UserRole.STAFF
    ) {
      throw new ForbiddenException(
        localizedError(ERROR_CODES.RESERVATION_UPDATE_FORBIDDEN),
      );
    }

    const checkIn = dto.checkIn
      ? parseHotelDayInput(dto.checkIn, 'checkIn')
      : startOfUtcDay(existing.checkIn);
    const checkOut = dto.checkOut
      ? parseHotelDayInput(dto.checkOut, 'checkOut')
      : startOfUtcDay(existing.checkOut);
    if (checkIn >= checkOut) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_INVALID_DATE_RANGE),
      );
    }
    const isCheckInDateFromPayload = 'checkIn' in dto;
    const isStatusCheckIn = dto.status === ReservationStatus.CHECKED_IN;
    const isRevertingFromCheckIn =
      existing.status === ReservationStatus.CHECKED_IN &&
      dto.status === ReservationStatus.CONFIRMED;
    if (
      isCheckInDateFromPayload &&
      !isStatusCheckIn &&
      !isRevertingFromCheckIn &&
      checkIn < startOfUtcDay(new Date())
    ) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_CHECKIN_IN_PAST),
      );
    }

    const requestedRoomTypeId = dto.roomTypeId ?? getLegacyRoomTypeId(dto);
    const roomTypeId = requestedRoomTypeId ?? existing.roomTypeId;
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!roomType || !roomType.isActive) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_ROOM_TYPE_NOT_AVAILABLE),
      );
    }

    const catIds = dto.catIds ?? existing.cats.map((c) => c.catId);
    if (!catIds.length) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_MIN_CATS_REQUIRED),
      );
    }

    const cats = await this.prisma.cat.findMany({
      where: { id: { in: catIds } },
    });
    if (cats.length !== catIds.length) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_CATS_NOT_FOUND),
      );
    }
    if (roomType.capacity < cats.length) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_ROOM_CAPACITY_EXCEEDED),
      );
    }
    await this.ensureCatsAvailable(catIds, checkIn, checkOut, id);
    const allowRoomSharing =
      dto.allowRoomSharing === undefined
        ? (existing.allowRoomSharing ?? true)
        : !!dto.allowRoomSharing;
    const requiredSlots = allowRoomSharing ? cats.length : roomType.capacity;

    await this.assertRoomTypeAvailability(
      roomType,
      checkIn,
      checkOut,
      requiredSlots,
      id,
    );

    const addons =
      dto.addons && dto.addons.length
        ? await this.prisma.addonService.findMany({
            where: { id: { in: dto.addons.map((a) => a.serviceId) } },
          })
        : [];

    const reservationServices: {
      serviceId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }[] = [];
    if (addons.length) {
      for (const addon of addons) {
        const requested = dto.addons!.find((a) => a.serviceId === addon.id)!;
        reservationServices.push({
          serviceId: addon.id,
          quantity: requested.quantity,
          unitPrice: addon.price,
        });
      }
    }

    let nights = differenceInHotelNights(checkOut, checkIn);
    if (nights <= 0) nights = 1;
    const normalizedPricing = this.normalizePricingSettings(
      await this.pricingSettings.getSettings(),
    );

    const status =
      dto.status && this.isValidTransition(existing.status, dto.status)
        ? dto.status
        : existing.status;
    const checkInFormValue =
      dto.checkInForm !== undefined ? dto.checkInForm : existing.checkInForm;
    const checkOutFormValue =
      dto.checkOutForm !== undefined ? dto.checkOutForm : existing.checkOutForm;

    const checkInForm =
      checkInFormValue === null || checkInFormValue === undefined
        ? Prisma.JsonNull
        : (checkInFormValue as Prisma.InputJsonValue);
    const checkOutForm =
      checkOutFormValue === null || checkOutFormValue === undefined
        ? Prisma.JsonNull
        : (checkOutFormValue as Prisma.InputJsonValue);

    let checkedInAt = existing.checkedInAt;
    if (dto.checkInForm?.arrivalTime) {
      checkedInAt = new Date(dto.checkInForm.arrivalTime);
    } else if (status === ReservationStatus.CHECKED_IN && !checkedInAt) {
      checkedInAt = new Date();
    }

    let checkedOutAt = existing.checkedOutAt;
    if (dto.checkOutForm?.departureTime) {
      checkedOutAt = new Date(dto.checkOutForm.departureTime);
    } else if (status === ReservationStatus.CHECKED_OUT && !checkedOutAt) {
      checkedOutAt = new Date();
    }

    return this.prisma.$transaction(
      async (tx) => {
        const freshRoomType = await tx.roomType.findUnique({
          where: { id: roomType.id },
        });
        if (!freshRoomType || !freshRoomType.isActive) {
          throw new BadRequestException(
            localizedError(ERROR_CODES.RESERVATION_ROOM_TYPE_NOT_AVAILABLE),
          );
        }
        if (freshRoomType.capacity < cats.length) {
          throw new BadRequestException(
            localizedError(ERROR_CODES.RESERVATION_ROOM_CAPACITY_EXCEEDED),
          );
        }
        await this.assertRoomTypeAvailability(
          freshRoomType,
          checkIn,
          checkOut,
          requiredSlots,
          id,
          tx,
        );
        const totalPrice = this.calculateTotalPrice(
          freshRoomType.nightlyRate,
          nights,
          reservationServices,
          {
            capacity: freshRoomType.capacity,
            catCount: cats.length,
            allowRoomSharing,
          },
          normalizedPricing,
        );

        await tx.reservation.update({
          where: { id },
          data: {
            roomTypeId: freshRoomType.id,
            checkIn,
            checkOut,
            totalPrice,
            specialRequests: dto.specialRequests ?? existing.specialRequests,
            allowRoomSharing,
            reservedSlots: requiredSlots,
            status,
            checkInForm,
            checkOutForm,
            checkedInAt,
            checkedOutAt,
            cats: {
              deleteMany: {},
              createMany: { data: catIds.map((catId) => ({ catId })) },
            },
            services: reservationServices.length
              ? {
                  deleteMany: {},
                  createMany: { data: reservationServices },
                }
              : undefined,
          },
        });

        await this.roomAssignmentService.rebalanceRoomType(
          freshRoomType.id,
          tx,
        );
        if (status === ReservationStatus.CHECKED_IN) {
          await this.roomAssignmentService.lockAssignmentsForReservation(
            id,
            tx,
          );
        }

        return tx.reservation.findUniqueOrThrow({
          where: { id },
          include: this.reservationIncludeWithPayments,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private isValidTransition(
    current: ReservationStatus,
    next: ReservationStatus,
  ) {
    const order: ReservationStatus[] = [
      ReservationStatus.PENDING,
      ReservationStatus.CONFIRMED,
      ReservationStatus.CHECKED_IN,
      ReservationStatus.CHECKED_OUT,
      ReservationStatus.CANCELLED,
    ];

    // İptalden geri almayı mümkün kıl: iptalden beklemeye veya onaya dönüşe izin ver.
    if (current === ReservationStatus.CANCELLED) {
      return (
        next === ReservationStatus.PENDING ||
        next === ReservationStatus.CONFIRMED
      );
    }
    if (next === ReservationStatus.CANCELLED) return true;

    const currentIdx = order.indexOf(current);
    const nextIdx = order.indexOf(next);
    if (nextIdx === -1 || currentIdx === -1) return false;

    // İleri veya en fazla bir adım geri gitmeye izin ver (check-out -> check-in, check-in -> onay vb.)
    return nextIdx >= currentIdx - 1;
  }

  private calculateTotalPrice(
    nightlyRate: Prisma.Decimal | number | string,
    nights: number,
    services: { unitPrice: Prisma.Decimal; quantity: number }[],
    options: { capacity: number; catCount: number; allowRoomSharing: boolean },
    pricing: NormalizedPricingSettings | null,
  ) {
    const safeCapacity = Math.max(options.capacity || 1, 1);
    const catCount = Math.max(options.catCount || 1, 1);
    const safeNights = Math.max(nights, 1);
    const perCatRate = new Prisma.Decimal(nightlyRate).div(safeCapacity);
    const slotCount = options.allowRoomSharing
      ? Math.min(catCount, safeCapacity)
      : safeCapacity;
    const baseNightly = options.allowRoomSharing
      ? perCatRate.mul(slotCount)
      : new Prisma.Decimal(nightlyRate);

    let total = baseNightly.mul(safeNights);
    const discount = this.calculateDiscountAmount(
      total,
      {
        catCount,
        nights: safeNights,
        remainingCapacity: options.allowRoomSharing
          ? Math.max(safeCapacity - catCount, 0)
          : 0,
        allowRoomSharing: options.allowRoomSharing,
      },
      pricing,
    );
    total = total.sub(discount);

    for (const service of services) {
      total = total.add(service.unitPrice.mul(service.quantity));
    }

    if (total.lessThan(0)) {
      total = new Prisma.Decimal(0);
    }
    return total;
  }

  private calculateDiscountAmount(
    baseTotal: Prisma.Decimal,
    context: {
      catCount: number;
      nights: number;
      remainingCapacity: number;
      allowRoomSharing: boolean;
    },
    pricing: NormalizedPricingSettings | null,
  ) {
    if (!pricing) {
      return new Prisma.Decimal(0);
    }
    let discount = new Prisma.Decimal(0);

    if (
      pricing.multiCatDiscountEnabled &&
      pricing.multiCatDiscounts.length > 0
    ) {
      const applied = pricing.multiCatDiscounts
        .filter((tier) => context.catCount >= tier.catCount)
        .pop();
      if (applied && applied.discountPercent > 0) {
        discount = discount.add(
          this.calculatePercentage(baseTotal, applied.discountPercent),
        );
      }
    }

    if (
      context.allowRoomSharing &&
      pricing.sharedRoomDiscountEnabled &&
      pricing.sharedRoomDiscounts.length > 0
    ) {
      const applied = pricing.sharedRoomDiscounts
        .filter((tier) => context.remainingCapacity >= tier.remainingCapacity)
        .pop();
      if (applied && applied.discountPercent > 0) {
        discount = discount.add(
          this.calculatePercentage(baseTotal, applied.discountPercent),
        );
      }
    }

    if (pricing.longStayDiscountEnabled && pricing.longStayDiscounts.length > 0) {
      const applied = pricing.longStayDiscounts
        .filter((tier) => context.nights >= tier.minNights)
        .pop();
      if (applied && applied.discountPercent > 0) {
        discount = discount.add(
          this.calculatePercentage(baseTotal, applied.discountPercent),
        );
      }
    }

    return discount;
  }

  private calculatePercentage(value: Prisma.Decimal, percent: number) {
    if (!Number.isFinite(percent) || percent <= 0) {
      return new Prisma.Decimal(0);
    }
    return value.mul(new Prisma.Decimal(percent).div(100));
  }

  private normalizePricingSettings(
    payload?: PricingSettingsResponseDto | null,
  ): NormalizedPricingSettings | null {
    if (!payload) {
      return null;
    }

    const multiCatDiscounts = (payload.multiCatDiscounts ?? [])
      .map((tier) => ({
        catCount: Math.max(1, Math.trunc(Number(tier.catCount))),
        discountPercent: Number(tier.discountPercent),
      }))
      .filter(
        (tier) =>
          Number.isFinite(tier.catCount) &&
          Number.isFinite(tier.discountPercent) &&
          tier.discountPercent > 0,
      )
      .sort((a, b) => a.catCount - b.catCount);

    let sharedSource =
      payload.sharedRoomDiscounts && payload.sharedRoomDiscounts.length > 0
        ? payload.sharedRoomDiscounts
        : undefined;
    if (
      (!sharedSource || sharedSource.length === 0) &&
      typeof payload.sharedRoomDiscountPercent === 'number' &&
      Number.isFinite(payload.sharedRoomDiscountPercent)
    ) {
      sharedSource = [
        {
          remainingCapacity: 1,
          discountPercent: payload.sharedRoomDiscountPercent,
        },
      ];
    }
    const sharedRoomDiscounts = (sharedSource ?? [])
      .map((tier) => ({
        remainingCapacity: Math.max(
          0,
          Math.trunc(Number(tier.remainingCapacity)),
        ),
        discountPercent: Number(tier.discountPercent),
      }))
      .filter(
        (tier) =>
          Number.isFinite(tier.remainingCapacity) &&
          Number.isFinite(tier.discountPercent) &&
          tier.discountPercent > 0,
      )
      .sort((a, b) => a.remainingCapacity - b.remainingCapacity);

    let longStaySource =
      payload.longStayDiscounts && payload.longStayDiscounts.length > 0
        ? payload.longStayDiscounts
        : undefined;
    if (
      (!longStaySource || longStaySource.length === 0) &&
      payload.longStayDiscount
    ) {
      longStaySource = [
        {
          minNights: payload.longStayDiscount.minNights,
          discountPercent: payload.longStayDiscount.discountPercent,
        },
      ];
    }
    const longStayDiscounts = (longStaySource ?? [])
      .map((tier) => ({
        minNights: Math.max(1, Math.trunc(Number(tier.minNights))),
        discountPercent: Number(tier.discountPercent),
      }))
      .filter(
        (tier) =>
          Number.isFinite(tier.minNights) &&
          Number.isFinite(tier.discountPercent) &&
          tier.discountPercent > 0,
      )
      .sort((a, b) => a.minNights - b.minNights);

    const longStayEnabled =
      typeof payload.longStayDiscountEnabled === 'boolean'
        ? payload.longStayDiscountEnabled
        : payload.longStayDiscount
          ? Boolean(payload.longStayDiscount.enabled)
          : false;

    return {
      multiCatDiscountEnabled: Boolean(payload.multiCatDiscountEnabled),
      multiCatDiscounts,
      sharedRoomDiscountEnabled: Boolean(payload.sharedRoomDiscountEnabled),
      sharedRoomDiscounts,
      longStayDiscountEnabled: longStayEnabled,
      longStayDiscounts,
    };
  }

  private getActiveRoomCount(
    roomTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = (tx ?? this.prisma) as
      | PrismaService
      | Prisma.TransactionClient;
    return client.room.count({
      where: { roomTypeId, isActive: true },
    });
  }

  private async assertRoomTypeAvailability(
    room: { id: string; overbookingLimit: number; capacity: number },
    checkIn: Date,
    checkOut: Date,
    requiredSlots: number,
    excludeReservationId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const [overlapping, activeRoomCount] = await Promise.all([
      client.reservation.findMany({
        where: {
          id: excludeReservationId ? { not: excludeReservationId } : undefined,
          roomTypeId: room.id,
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
              ReservationStatus.CHECKED_IN,
            ],
          },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
        select: { reservedSlots: true },
      }),
      this.getActiveRoomCount(room.id, tx),
    ]);

    const totalSlots =
      (activeRoomCount + room.overbookingLimit) * (room.capacity || 1);
    const takenSlots = overlapping.reduce(
      (sum, res) =>
        sum + (res.reservedSlots > 0 ? res.reservedSlots : room.capacity || 1),
      0,
    );
    const remaining = totalSlots - takenSlots;
    if (remaining < requiredSlots) {
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_ROOM_TYPE_UNAVAILABLE_DATES),
      );
    }
    return remaining;
  }

  private async ensureCatsAvailable(
    catIds: string[],
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string,
  ) {
    if (!catIds.length) return;
    const overlapping = await this.prisma.reservation.findMany({
      where: {
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        cats: { some: { catId: { in: catIds } } },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: {
        id: true,
        code: true,
        cats: {
          where: { catId: { in: catIds } },
          select: { cat: { select: { name: true } } },
        },
      },
    });
    if (overlapping.length) {
      const names = overlapping
        .flatMap((r) => r.cats.map((c) => c.cat.name))
        .filter(Boolean)
        .join(', ');
      throw new BadRequestException(
        localizedError(ERROR_CODES.RESERVATION_CAT_CONFLICT, {
          catNames: names || '-',
        }),
      );
    }
  }
}
