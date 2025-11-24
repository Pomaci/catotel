import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ReservationStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { differenceInCalendarDays } from 'date-fns';
import { randomBytes } from 'crypto';
import { publicUserSelect } from 'src/user/public-user.select';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        room: true,
        customer: { include: { user: { select: publicUserSelect } } },
        cats: { include: { cat: true } },
        services: { include: { service: true } },
      },
    });
  }

  async getById(id: string, userId: string, role: UserRole) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: true,
        customer: { include: { user: { select: publicUserSelect } } },
        cats: { include: { cat: true } },
        services: { include: { service: true } },
        payments: true,
      },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (role === UserRole.CUSTOMER && reservation.customer.userId !== userId) {
      throw new ForbiddenException('You cannot view this reservation');
    }
    return reservation;
  }

  async create(userId: string, dto: CreateReservationDto) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { cats: true },
    });
    if (!customer) {
      throw new BadRequestException('Customer profile not found');
    }

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    const cats = await this.prisma.cat.findMany({
      where: { id: { in: dto.catIds } },
    });
    if (cats.length !== dto.catIds.length) {
      throw new BadRequestException('Some cats were not found');
    }
    for (const cat of cats) {
      if (cat.customerId !== customer.id) {
        throw new ForbiddenException(`Cat ${cat.name} does not belong to you`);
      }
    }

    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!room || !room.isActive) {
      throw new BadRequestException('Room not available');
    }
    if (room.capacity < cats.length) {
      throw new BadRequestException('Room capacity exceeded');
    }

    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        roomId: room.id,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        OR: [
          {
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        ],
      },
    });
    if (overlapping) {
      throw new BadRequestException('Room already booked for selected dates');
    }

    let nights = differenceInCalendarDays(checkOut, checkIn);
    if (nights <= 0) {
      nights = 1;
    }
    let totalPrice = Number(room.nightlyRate) * nights;

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
        totalPrice += Number(addon.price) * requested.quantity;
        reservationServices.push({
          serviceId: addon.id,
          quantity: requested.quantity,
          unitPrice: addon.price,
        });
      }
    }

    const code = `CAT-${randomBytes(3).toString('hex').toUpperCase()}`;

    return this.prisma.$transaction(
      async (tx) => {
        const overlapping = await tx.reservation.findFirst({
          where: {
            roomId: room.id,
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            OR: [
              {
                checkIn: { lt: checkOut },
                checkOut: { gt: checkIn },
              },
            ],
          },
        });
        if (overlapping) {
          throw new BadRequestException(
            'Room already booked for selected dates',
          );
        }

        return tx.reservation.create({
          data: {
            code,
            customerId: customer.id,
            roomId: room.id,
            checkIn,
            checkOut,
            totalPrice,
            specialRequests: dto.specialRequests,
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
          include: {
            room: true,
            cats: { include: { cat: true } },
            services: { include: { service: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
