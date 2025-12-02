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
    room: { findUnique: jest.fn() },
    reservation: { findFirst: jest.fn() },
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
  });

  const baseCustomer = { id: 'cust-1', userId: 'user-1' };
  const baseRoom = {
    id: 'room-1',
    isActive: true,
    capacity: 2,
    nightlyRate: decimal('150.50'),
  };

  function mockTx() {
    const txReservation = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) => ({
        ...data,
        id: 'res-1',
        status: ReservationStatus.PENDING,
      })),
    };
    const tx = {
      reservation: txReservation,
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
    mockPrisma.room.findUnique = jest.fn().mockResolvedValue(baseRoom);
    mockPrisma.reservation.findFirst = jest.fn().mockResolvedValue(null);
    mockPrisma.addonService.findMany = jest.fn().mockResolvedValue([
      { id: 'svc-1', price: decimal('19.99') },
      { id: 'svc-2', price: decimal('5.25') },
    ]);
    const txReservation = mockTx();

    await service.create('user-1', {
      roomId: baseRoom.id,
      checkIn: new Date('2025-12-01').toISOString(),
      checkOut: new Date('2025-12-03').toISOString(),
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

  it('blocks overlapping reservations inside transaction', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 'cat-1', customerId: baseCustomer.id }]);
    mockPrisma.room.findUnique = jest.fn().mockResolvedValue(baseRoom);
    mockPrisma.reservation.findFirst = jest.fn().mockResolvedValue(null);
    mockPrisma.addonService.findMany = jest.fn().mockResolvedValue([]);
    const txReservation = mockTx();
    txReservation.findFirst.mockResolvedValueOnce({ id: 'existing' });

    await expect(
      service.create('user-1', {
        roomId: baseRoom.id,
        checkIn: new Date('2025-12-01').toISOString(),
        checkOut: new Date('2025-12-02').toISOString(),
        catIds: ['cat-1'],
      }),
    ).rejects.toThrow(/Room already booked/);
  });

  it('rejects missing customer profile', async () => {
    mockPrisma.customerProfile.findUnique = jest.fn().mockResolvedValue(null);
    await expect(
      service.create('user-1', {
        roomId: 'room-1',
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inactive room or over capacity', async () => {
    mockPrisma.customerProfile.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseCustomer, cats: [] });
    mockPrisma.cat.findMany = jest.fn().mockResolvedValue([
      { id: 'cat-1', customerId: baseCustomer.id },
      { id: 'cat-2', customerId: baseCustomer.id },
      { id: 'cat-3', customerId: baseCustomer.id },
    ]);
    mockPrisma.room.findUnique = jest
      .fn()
      .mockResolvedValue({ ...baseRoom, isActive: false });

    await expect(
      service.create('user-1', {
        roomId: 'room-1',
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    mockPrisma.room.findUnique = jest.fn().mockResolvedValue(baseRoom);
    await expect(
      service.create('user-1', {
        roomId: 'room-1',
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
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
    await expect(
      service.create('user-1', {
        roomId: 'room-1',
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        catIds: ['cat-1'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
