import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { RoomTypesService } from './room-types.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RoomTypesService', () => {
  let service: RoomTypesService;
  const mockPrisma = {
    roomType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    reservation: { groupBy: jest.fn() },
    room: { count: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoomTypesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(RoomTypesService);
    jest.clearAllMocks();
  });

  it('creates a room type with decimal nightlyRate', async () => {
    mockPrisma.roomType.create = jest.fn().mockResolvedValue({ id: 'type-1' });

    await service.create({
      name: 'Deluxe',
      capacity: 2,
      nightlyRate: 200.5,
    });

    expect(mockPrisma.roomType.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nightlyRate: new Prisma.Decimal(200.5),
      }),
    });
  });

  it('updates nightlyRate when provided', async () => {
    mockPrisma.roomType.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'type-1' });
    mockPrisma.roomType.update = jest.fn().mockResolvedValue({ id: 'type-1' });

    await service.update('type-1', { nightlyRate: 320 });

    expect(mockPrisma.roomType.update).toHaveBeenCalledWith({
      where: { id: 'type-1' },
      data: expect.objectContaining({
        nightlyRate: new Prisma.Decimal(320),
      }),
    });
  });

  it('throws when updating missing room type', async () => {
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
      'Room type not found',
    );
  });
});
