import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { Prisma, UserRole } from '@prisma/client';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async register({ email, password, name }: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: UserRole.CUSTOMER,
        customer: { create: {} },
      },
      include: {
        customer: true,
        staff: true,
      },
    });

    void this.mail
      .sendWelcomeEmail(user.email, user.name ?? undefined)
      .catch((err) =>
        this.logger.error('Failed to send welcome email after register', err),
      );

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { customer: true, staff: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { customer: true, staff: true },
    });
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true, staff: true },
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async createManagedUser({
    email,
    password,
    name,
    role,
  }: CreateManagedUserDto) {
    if (role === UserRole.CUSTOMER) {
      throw new BadRequestException(
        'Customer role cannot be assigned via managed endpoint',
      );
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role,
        staff:
          role === UserRole.STAFF || role === UserRole.MANAGER
            ? { create: {} }
            : undefined,
      },
      include: { customer: true, staff: true },
    });
    void this.mail
      .sendWelcomeEmail(user.email, user.name ?? undefined)
      .catch((err) =>
        this.logger.error(
          'Failed to send welcome email after user creation',
          err,
        ),
      );

    return this.sanitizeUser(user);
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { customer: true, staff: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === role) {
      return this.sanitizeUser(user);
    }

    if (role === UserRole.CUSTOMER) {
      await this.prisma.customerProfile.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    }

    if (role === UserRole.STAFF || role === UserRole.MANAGER) {
      await this.prisma.staffProfile.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      include: { customer: true, staff: true },
    });

    return this.sanitizeUser(updated);
  }

  private sanitizeUser(
    user: Prisma.UserGetPayload<{ include: { customer: true; staff: true } }>,
  ) {
    const { customer, staff, ...rest } = user;
    return {
      id: rest.id,
      email: rest.email,
      name: rest.name,
      role: rest.role,
      createdAt: rest.createdAt,
      hasCustomerProfile: Boolean(customer),
      hasStaffProfile: Boolean(staff),
    };
  }
}
