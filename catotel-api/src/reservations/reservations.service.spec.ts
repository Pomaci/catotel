import { Test } from '@nestjs/testing';
import { Prisma, ReservationStatus, UserRole } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const decimal = (value: string | number) => new Prisma.Decimal(value);

describe('ReservationsService', () => {
  let service: ReservationsService;
  const mockPrisma = {
    customerProfile: { findUnique: jest.fn() },
    cat: { findMany: jest.fn() },
    roomType: { findUnique: jest.fn() },
    room: { count: jest.fn() },
    reservation: {
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    addonService: { findMany: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ReservationsService);

    jest.clearAllMocks();
    (mockPrisma.reservation.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.reservation.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.room.count as jest.Mock).mockResolvedValue(1);
  });

  const baseCustomer = { id: 'cust-1', userId: 'user-1' };
  const baseRoomType = {
    id: 'type-1',
    name: 'Deluxe',
    isActive: true,
    capacity: 2,
    overbookingLimit: 0,
    nightlyRate: decimal('150.50'),
  };
  const futureDate = (daysAhead: number) =>
    new Date(Date.now() + daysAhead * 86_400_000).toISOString();

  function mockTx(activeRooms = 1, overlapping = 0) {
    const txReservation = {
      count: jest.fn().mockResolvedValue(overlapping),
      create: jest.fn().mockImplementation(({ data }) => ({
        ...data,
        id: 'res-1',
        status: ReservationStatus.PENDING,
      })),
      update: jest.fn(),
    };
    const tx = {
      reservation: txReservation,
      roomType: { findUnique: jest.fn().mockResolvedValue(baseRoomType) },
      room: { count: jest.fn().mockResolvedValue(activeRooms) },
    };
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb(tx),
    );
    return txReservation;
  }

  it('calculates total with decimals and add-ons without rounding drift', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 'cat-1', customerId: baseCustomer.id }]);
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(baseRoomType);
    mockPrisma.room.count = jest.fn().mockResolvedValue(1);
    mockPrisma.reservation.count = jest.fn().mockResolvedValue(0);
    mockPrisma.addonService.findMany = jest.fn().mockResolvedValue([
      { id: 'svc-1', price: decimal('19.99') },
      { id: 'svc-2', price: decimal('5.25') },
    ]);
    const txReservation = mockTx();

    await service.create('user-1', UserRole.CUSTOMER, {
      roomTypeId: baseRoomType.id,
      checkIn: futureDate(3),
      checkOut: futureDate(5),
      catIds: ['cat-1'],
      addons: [
        { serviceId: 'svc-1', quantity: 2 },
        { serviceId: 'svc-2', quantity: 1 },
      ],
    });

    const totalPrice: Prisma.Decimal =
      txReservation.create.mock.calls[0][0].data.totalPrice;
    expect(totalPrice.equals(new Prisma.Decimal('346.23'))).toBe(true);
  });

  it('blocks overlapping reservations when limit reached', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 'cat-1', customerId: baseCustomer.id }]);
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(baseRoomType);
    mockPrisma.room.count = jest.fn().mockResolvedValue(1);
    mockPrisma.reservation.count = jest.fn().mockResolvedValue(1);
    mockPrisma.addonService.findMany = jest.fn().mockResolvedValue([]);
    const txReservation = mockTx(1, 1);

    await expect(
      service.create('user-1', UserRole.CUSTOMER, {
        roomTypeId: baseRoomType.id,
        checkIn: futureDate(3),
        checkOut: futureDate(4),
        catIds: ['cat-1'],
      }),
    ).rejects.toThrow(/Room type not available/);

    expect(txReservation.count).toHaveBeenCalled();
  });

  it('rejects when no active rooms exist for selected type', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 'cat-1', customerId: baseCustomer.id }]);
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(baseRoomType);
    mockPrisma.room.count = jest.fn().mockResolvedValue(0);

    await expect(
      service.create('user-1', UserRole.CUSTOMER, {
        roomTypeId: baseRoomType.id,
        checkIn: futureDate(1),
        checkOut: futureDate(2),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing customer profile', async () => {
    mockPrisma.customerProfile.findUnique = jest.fn().mockResolvedValue(null);
    await expect(
      service.create('user-1', UserRole.CUSTOMER, {
        roomTypeId: 'type-1',
        checkIn: futureDate(1),
        checkOut: futureDate(2),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inactive room type or over capacity', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest.fn().mockResolvedValue([
      { id: 'cat-1', customerId: baseCustomer.id },
      { id: 'cat-2', customerId: baseCustomer.id },
      { id: 'cat-3', customerId: baseCustomer.id },
    ]);
    mockPrisma.roomType.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseRoomType, isActive: false });

    await expect(
      service.create('user-1', UserRole.CUSTOMER, {
        roomTypeId: 'type-1',
        checkIn: futureDate(1),
        checkOut: futureDate(2),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(baseRoomType);
    await expect(
      service.create('user-1', UserRole.CUSTOMER, {
        roomTypeId: 'type-1',
        checkIn: futureDate(1),
        checkOut: futureDate(2),
        catIds: ['cat-1', 'cat-2', 'cat-3'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when cat does not belong to customer', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 'cat-1', customerId: 'another' }]);
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(baseRoomType);

    await expect(
      service.create('user-1', UserRole.CUSTOMER, {
        roomTypeId: 'type-1',
        checkIn: futureDate(1),
        checkOut: futureDate(2),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when updating non-existent reservation', async () => {
    mockPrisma.reservation.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.update('missing', UserRole.STAFF, {
        roomTypeId: 'type-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
