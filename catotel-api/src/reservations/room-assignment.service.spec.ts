import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { RoomAssignmentService } from './room-assignment.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('RoomAssignmentService', () => {
  let service: RoomAssignmentService;

  const mockPrisma = {
    roomType: { findUnique: jest.fn() },
    roomAssignment: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    reservation: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const baseRoomType = {
    id: 'type-1',
    capacity: 2,
    isActive: true,
    rooms: [
      { id: 'room-a', isActive: true, name: 'A' },
      { id: 'room-b', isActive: true, name: 'B' },
    ],
  };

  const resetMocks = () => {
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue(baseRoomType);
    mockPrisma.roomAssignment.deleteMany = jest.fn().mockResolvedValue({});
    mockPrisma.roomAssignment.create = jest.fn();
    mockPrisma.roomAssignment.updateMany = jest.fn();
    mockPrisma.reservation.findMany = jest.fn().mockResolvedValue([]);
  };

  beforeEach(async () => {
    resetMocks();
    const module = await Test.createTestingModule({
      providers: [
        RoomAssignmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(RoomAssignmentService);
  });

  const reservationRange = (startDay: number, nights: number) => {
    const start = new Date(`2025-02-${String(startDay).padStart(2, '0')}T12:00:00Z`);
    const end = new Date(start.getTime() + nights * 24 * 60 * 60 * 1000);
    return { checkIn: start, checkOut: end };
  };

  it('rejects reservations that exceed room capacity', async () => {
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue({
      ...baseRoomType,
      capacity: 1,
    });
    const { checkIn, checkOut } = reservationRange(1, 1);
    mockPrisma.reservation.findMany = jest.fn().mockResolvedValue([
      {
        id: 'res-overflow',
        customerId: 'cust-1',
        status: ReservationStatus.PENDING,
        allowRoomSharing: true,
        cats: [{ catId: 'cat-1' }, { catId: 'cat-2' }],
        roomAssignments: [],
        checkIn,
        checkOut,
      },
    ]);

    await expect(service.rebalanceRoomType('type-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockPrisma.roomAssignment.create).not.toHaveBeenCalled();
  });

  it('fails gracefully when no dedicated room is available for a non-sharing guest', async () => {
    mockPrisma.roomType.findUnique = jest.fn().mockResolvedValue({
      ...baseRoomType,
      rooms: [{ id: 'room-a', isActive: true, name: 'A' }],
    });
    const overlapping = reservationRange(5, 2);
    mockPrisma.reservation.findMany = jest.fn().mockResolvedValue([
      {
        id: 'res-locked',
        customerId: 'cust-locked',
        status: ReservationStatus.CHECKED_IN,
        allowRoomSharing: true,
        cats: [{ catId: 'cat-locked' }],
        roomAssignments: [
          {
            id: 'assign-locked',
            roomId: 'room-a',
            allowRoomSharing: true,
            catCount: 1,
            checkIn: overlapping.checkIn,
            checkOut: overlapping.checkOut,
            lockedAt: new Date(),
          },
        ],
        checkIn: overlapping.checkIn,
        checkOut: overlapping.checkOut,
      },
      {
        id: 'res-private',
        customerId: 'cust-2',
        status: ReservationStatus.PENDING,
        allowRoomSharing: false,
        cats: [{ catId: 'cat-2' }],
        roomAssignments: [],
        checkIn: overlapping.checkIn,
        checkOut: overlapping.checkOut,
      },
    ]);

    await expect(service.rebalanceRoomType('type-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockPrisma.roomAssignment.create).not.toHaveBeenCalled();
  });

  it('creates assignments with persisted cat mappings for available rooms', async () => {
    const { checkIn, checkOut } = reservationRange(10, 3);
    mockPrisma.reservation.findMany = jest.fn().mockResolvedValue([
      {
        id: 'res-new',
        customerId: 'cust-3',
        status: ReservationStatus.CONFIRMED,
        allowRoomSharing: true,
        cats: [{ catId: 'cat-1' }, { catId: 'cat-2' }],
        roomAssignments: [],
        checkIn,
        checkOut,
      },
    ]);
    mockPrisma.roomAssignment.create = jest
      .fn()
      .mockResolvedValue({ id: 'assignment-1' });

    await service.rebalanceRoomType('type-1');

    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reservationId: 'res-new',
        catCount: 2,
        cats: {
          createMany: {
            data: [
              { catId: 'cat-1' },
              { catId: 'cat-2' },
            ],
            skipDuplicates: true,
          },
        },
      }),
    });
  });

  it('locks assignments for a reservation', async () => {
    mockPrisma.roomAssignment.updateMany = jest.fn().mockResolvedValue({
      count: 1,
    });
    await service.lockAssignmentsForReservation('res-lock');
    expect(mockPrisma.roomAssignment.updateMany).toHaveBeenCalledWith({
      where: { reservationId: 'res-lock' },
      data: expect.objectContaining({ lockedAt: expect.any(Date) }),
    });
  });
});
