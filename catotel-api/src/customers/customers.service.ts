import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { publicUserSelect } from 'src/user/public-user.select';
import {
  AdminCustomerListItemDto,
  AdminCustomerListResponseDto,
} from './dto/admin-customer-list.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: publicUserSelect },
        cats: true,
        reservations: {
          orderBy: { createdAt: 'desc' },
          include: {
            room: true,
            cats: { include: { cat: true } },
          },
          take: 5,
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }

  async updateProfile(userId: string, dto: UpdateCustomerDto) {
    await this.ensureCustomer(userId);
    return this.prisma.customerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async listCats(userId: string) {
    await this.ensureCustomer(userId);
    return this.prisma.cat.findMany({
      where: { customer: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCat(userId: string, dto: CreateCatDto) {
    const customer = await this.ensureCustomer(userId);
    return this.prisma.cat.create({
      data: {
        ...dto,
        customerId: customer.id,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async listCatsByCustomerId(customerId: string) {
    await this.ensureCustomerById(customerId);
    return this.prisma.cat.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCatForCustomer(customerId: string, dto: CreateCatDto) {
    await this.ensureCustomerById(customerId);
    return this.prisma.cat.create({
      data: {
        ...dto,
        customerId,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async updateCat(userId: string, catId: string, dto: UpdateCatDto) {
    const cat = await this.prisma.cat.findUnique({ where: { id: catId } });
    if (!cat) {
      throw new NotFoundException('Cat not found');
    }
    const customer = await this.ensureCustomer(userId);
    if (cat.customerId !== customer.id) {
      throw new ForbiddenException('This cat does not belong to you');
    }
    return this.prisma.cat.update({
      where: { id: catId },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : cat.birthDate,
      },
    });
  }

  async listAdminCustomers(params: {
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<AdminCustomerListResponseDto> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 25), 100);
    const skip = (page - 1) * pageSize;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const where: Prisma.CustomerProfileWhereInput = {};

    if (params.search?.trim()) {
      const q = params.search.trim();
      const digits = q.replace(/\D/g, '');
      where.user = {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          ...(digits ? [{ customer: { phone: { contains: digits } } }] : []),
        ],
      };
    }

    if (params.status === 'ACTIVE') {
      where.reservations = { some: { createdAt: { gte: oneYearAgo } } };
    } else if (params.status === 'INACTIVE') {
      where.reservations = { none: { createdAt: { gte: oneYearAgo } } };
    }

    let orderBy: Prisma.CustomerProfileOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    const sortDir = params.sortDir ?? 'desc';
    switch (params.sortBy) {
      case 'name':
        orderBy = { user: { name: sortDir } };
        break;
      case 'cats':
        orderBy = { cats: { _count: sortDir } };
        break;
      case 'reservations':
        orderBy = { reservations: { _count: sortDir } };
        break;
      case 'joinedAt':
        orderBy = { createdAt: sortDir };
        break;
      default:
        break;
    }

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customerProfile.count({ where }),
      this.prisma.customerProfile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
          _count: { select: { cats: true, reservations: true } },
          reservations: {
            select: { createdAt: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const items: AdminCustomerListItemDto[] = customers.map((customer) => {
      const lastReservation = customer.reservations[0] ?? null;
      const status =
        lastReservation && lastReservation.createdAt >= oneYearAgo
          ? 'ACTIVE'
          : 'INACTIVE';
      return {
        id: customer.id,
        userId: customer.userId,
        name: customer.user.name,
        email: customer.user.email,
        phone: customer.phone ?? null,
        catCount: customer._count.cats,
        reservationCount: customer._count.reservations,
        status,
        joinedAt: customer.createdAt,
        lastReservationAt: lastReservation?.createdAt ?? null,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async deleteCustomer(customerId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { id: true, userId: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: { customerId },
      select: { id: true },
    });
    const reservationIds = reservations.map((r) => r.id);

    const cats = await this.prisma.cat.findMany({
      where: { customerId },
      select: { id: true },
    });
    const catIds = cats.map((c) => c.id);

    await this.prisma.$transaction([
      this.prisma.reservationService.deleteMany({
        where: { reservationId: { in: reservationIds } },
      }),
      this.prisma.payment.deleteMany({
        where: { reservationId: { in: reservationIds } },
      }),
      this.prisma.careTask.deleteMany({
        where: {
          OR: [
            { reservationId: { in: reservationIds } },
            { catId: { in: catIds } },
          ],
        },
      }),
      this.prisma.reservationCat.deleteMany({
        where: { reservationId: { in: reservationIds } },
      }),
      this.prisma.reservation.deleteMany({ where: { id: { in: reservationIds } } }),
      this.prisma.cat.deleteMany({ where: { id: { in: catIds } } }),
      this.prisma.customerProfile.delete({ where: { id: customerId } }),
      this.prisma.user.delete({ where: { id: customer.userId } }),
    ]);

    return { success: true };
  }

  private async ensureCustomer(userId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }

  private async ensureCustomerById(id: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }
}
