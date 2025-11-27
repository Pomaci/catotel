import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RoomsService', () => {
  let service: RoomsService;
  const mockPrisma = {
    room: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(RoomsService);
    jest.clearAllMocks();
  });

  it('creates a room with decimal nightlyRate', async () => {
    mockPrisma.room.create = jest.fn().mockResolvedValue({ id: 'room-1' });

    await service.create({
      name: 'Suite 1',
      description: 'Test room',
      capacity: 2,
      nightlyRate: 199.99,
      isActive: true,
    });

    expect(mockPrisma.room.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nightlyRate: new Prisma.Decimal(199.99),
      }),
    });
  });

  it('updates a room with decimal nightlyRate when provided', async () => {
    mockPrisma.room.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'room-1', nightlyRate: new Prisma.Decimal(100) });
    mockPrisma.room.update = jest.fn().mockResolvedValue({ id: 'room-1' });

    await service.update('room-1', { nightlyRate: 250.5 });

    expect(mockPrisma.room.update).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      data: expect.objectContaining({
        nightlyRate: new Prisma.Decimal(250.5),
      }),
    });
  });

  it('updates a room without overwriting nightlyRate when omitted', async () => {
    mockPrisma.room.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'room-1', nightlyRate: new Prisma.Decimal(100) });
    mockPrisma.room.update = jest.fn().mockResolvedValue({ id: 'room-1' });

    await service.update('room-1', { name: 'Updated' });

    expect(
      mockPrisma.room.update.mock.calls[0][0].data,
    ).not.toHaveProperty('nightlyRate');
  });

  it('throws NotFound when updating non-existent room', async () => {
    mockPrisma.room.findUnique = jest.fn().mockResolvedValue(null);
    await expect(
      service.update('missing', { name: 'Updated' }),
    ).rejects.toThrow('Room not found');
  });
});
