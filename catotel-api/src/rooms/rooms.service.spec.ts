import { Test } from '@nestjs/testing';
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
    roomType: {
      findUnique: jest.fn(),
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

  it('creates a room when room type is active', async () => {
    mockPrisma.roomType.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'type-1', isActive: true });
    mockPrisma.room.create = jest.fn().mockResolvedValue({ id: 'room-1' });

    await service.create({
      name: '101',
      roomTypeId: 'type-1',
      description: 'Ground floor',
    });

    expect(mockPrisma.roomType.findUnique).toHaveBeenCalledWith({
      where: { id: 'type-1' },
    });
    expect(mockPrisma.room.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '101',
        roomTypeId: 'type-1',
      }),
      include: { roomType: true },
    });
  });

  it('throws when creating with inactive room type', async () => {
    mockPrisma.roomType.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'type-1', isActive: false });
    await expect(
      service.create({ name: '101', roomTypeId: 'type-1' }),
    ).rejects.toThrow(/Room type not found or inactive/);
  });

  it('throws NotFound when updating non-existent room', async () => {
    mockPrisma.room.findUnique = jest.fn().mockResolvedValue(null);
    await expect(
      service.update('missing', { name: 'Updated' }),
    ).rejects.toThrow('Room not found');
  });

  it('validates target room type on update', async () => {
    mockPrisma.room.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'room-1', roomTypeId: 'type-1' });
    mockPrisma.roomType.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'type-2', isActive: true });
    mockPrisma.room.update = jest.fn().mockResolvedValue({ id: 'room-1' });

    await service.update('room-1', { roomTypeId: 'type-2' });

    expect(mockPrisma.roomType.findUnique).toHaveBeenCalledWith({
      where: { id: 'type-2' },
    });
    expect(mockPrisma.room.update).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      data: expect.objectContaining({ roomTypeId: 'type-2' }),
      include: { roomType: true },
    });
  });
});
