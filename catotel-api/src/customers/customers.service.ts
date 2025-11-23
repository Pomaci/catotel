import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { publicUserSelect } from 'src/user/public-user.select';

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

  private async ensureCustomer(userId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }
}
