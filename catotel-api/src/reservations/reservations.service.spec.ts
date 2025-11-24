import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReservationsService } from './reservations.service';
import type { PrismaService } from 'src/prisma/prisma.service';

describe('ReservationsService', () => {
  const mockPrisma = {
    customerProfile: { findUnique: jest.fn() },
    cat: { findMany: jest.fn() },
    room: { findUnique: jest.fn() },
    reservation: { findFirst: jest.fn(), create: jest.fn() },
    addonService: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const service = new ReservationsService(mockPrisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseDto = {
    checkIn: new Date('2025-12-01T12:00:00Z').toISOString(),
    checkOut: new Date('2025-12-05T12:00:00Z').toISOString(),
    roomId: 'room-1',
    catIds: ['cat-1'],
    addons: [],
    specialRequests: 'Near window',
  };

  it('creates a reservation when data is valid', async () => {
    (mockPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      userId: 'user-1',
    });
    (mockPrisma.cat.findMany as jest.Mock).mockResolvedValue([
      { id: 'cat-1', customerId: 'cust-1', name: 'Mia' },
    ]);
    (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue({
      id: 'room-1',
      isActive: true,
      capacity: 2,
      nightlyRate: new Prisma.Decimal(100),
    });
    (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.addonService.findMany as jest.Mock).mockResolvedValue([]);
    const createdReservation = { id: 'res-1', code: 'CAT-ABC' };
    (mockPrisma.reservation.create as jest.Mock).mockResolvedValue(
      createdReservation,
    );

    const result = await service.create('user-1', baseDto);

    expect(mockPrisma.reservation.create).toHaveBeenCalled();
    expect(result).toBe(createdReservation);
    const createArgs = (mockPrisma.reservation.create as jest.Mock).mock
      .calls[0][0].data;
    expect(createArgs.roomId).toBe('room-1');
    expect(createArgs.customerId).toBe('cust-1');
    expect(createArgs.cats?.createMany?.data).toEqual([{ catId: 'cat-1' }]);
    expect(createArgs.totalPrice).toBeGreaterThan(0);
  });

  it('rejects when cat does not belong to customer', async () => {
    (mockPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      userId: 'user-1',
    });
    (mockPrisma.cat.findMany as jest.Mock).mockResolvedValue([
      { id: 'cat-1', customerId: 'other', name: 'Mia' },
    ]);

    await expect(service.create('user-1', baseDto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects when room is inactive or missing', async () => {
    (mockPrisma.customerProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'cust-1',
      userId: 'user-1',
    });
    (mockPrisma.cat.findMany as jest.Mock).mockResolvedValue([
      { id: 'cat-1', customerId: 'cust-1', name: 'Mia' },
    ]);
    (mockPrisma.room.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.create('user-1', baseDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
