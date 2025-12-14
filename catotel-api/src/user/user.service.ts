import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { addMinutes, subMinutes } from 'date-fns';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { EnvVars } from 'src/config/config.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerSearchDto } from './dto/customer-search.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly resetUrl: string;
  private readonly resetTtlMinutes: number;
  private readonly resetRequestLimit: number;
  private readonly resetRequestWindowMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<EnvVars>,
  ) {
    this.resetUrl =
      this.config.get('PASSWORD_RESET_URL', { infer: true }) ??
      'http://localhost:3100/auth/reset-password';
    this.resetTtlMinutes =
      this.config.get('PASSWORD_RESET_TOKEN_TTL_MINUTES', { infer: true }) ??
      30;
    this.resetRequestLimit =
      this.config.get('PASSWORD_RESET_EMAIL_MAX_PER_WINDOW', {
        infer: true,
      }) ?? 3;
    this.resetRequestWindowMinutes =
      this.config.get('PASSWORD_RESET_EMAIL_WINDOW_MINUTES', {
        infer: true,
      }) ?? 15;
  }

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

    try {
      await this.mail.sendWelcomeEmail(user.email, user.name ?? undefined);
    } catch (err) {
      this.logger.warn(`Welcome email failed to send: ${String(err)}`);
    }

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

    try {
      await this.mail.sendWelcomeEmail(user.email, user.name ?? undefined);
    } catch (err) {
      this.logger.warn(`Welcome email failed to send: ${String(err)}`);
    }

    return this.sanitizeUser(user);
  }

  async createCustomerAsStaff({
    email,
    password,
    name,
    phone,
  }: CreateCustomerDto) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const generated =
      password ||
      randomBytes(6)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 10);
    const hashed = await bcrypt.hash(generated, 10);
    const normalizedPhone = this.normalizePhone(phone);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: UserRole.CUSTOMER,
        customer: { create: { phone: normalizedPhone } },
      },
      include: { customer: true, staff: true },
    });

    // Invitation mail: let customer set their own password
    try {
      await this.sendPasswordSetupEmail(
        user.id,
        user.email,
        user.name ?? undefined,
      );
    } catch (err) {
      this.logger.warn(
        `Customer invite email could not be sent: ${String(err)}`,
      );
    }

    return {
      ...this.sanitizeUser(user),
      tempPassword: generated,
      customerId: user.customer?.id,
    };
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

  async searchCustomers(query: string): Promise<CustomerSearchDto[]> {
    if (!query.trim()) return [];
    const q = query.trim();
    const qDigits = q.replace(/\D/g, '');
    const or: Prisma.UserWhereInput[] = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { customer: { phone: { contains: q } } },
    ];
    if (qDigits) {
      or.push({ customer: { phone: { contains: qDigits } } });
    }
    const users = await this.prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,
        OR: or,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
    return users.map((u) => ({
      id: u.customer?.id ?? '',
      email: u.email,
      name: u.name,
      phone: u.customer?.phone ?? null,
    }));
  }

  private normalizePhone(phone?: string | null): string | undefined {
    if (!phone) return undefined;
    // Strip non-digit characters
    let digits = phone.replace(/\D/g, '');
    // Drop leading 00 (intl prefix) or 0 (local)
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    // If Turkish 10-digit local number, prepend country code
    if (digits.length === 10 && !digits.startsWith('90')) {
      digits = `90${digits}`;
    }
    if (digits.length < 10) {
      throw new BadRequestException('Invalid phone number');
    }
    return `+${digits}`;
  }

  private async ensurePasswordEmailAllowed(userId: string) {
    const windowStart = subMinutes(new Date(), this.resetRequestWindowMinutes);
    const recentRequests = await this.prisma.passwordResetToken.count({
      where: {
        userId,
        createdAt: { gt: windowStart },
      },
    });

    if (recentRequests >= this.resetRequestLimit) {
      throw new HttpException(
        'Too many password reset requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private digestToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendPasswordSetupEmail(
    userId: string,
    email: string,
    name?: string,
  ) {
    await this.ensurePasswordEmailAllowed(userId);

    const now = new Date();
    const token = randomUUID();
    const tokenHash = this.digestToken(token);
    const expiresAt = addMinutes(now, this.resetTtlMinutes);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId, usedAt: null, expiresAt: { gt: now } },
        data: { expiresAt: now },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId, tokenHash, expiresAt },
      }),
    ]);

    const link = `${this.resetUrl}${this.resetUrl.includes('?') ? '&' : '?'}token=${token}`;
    await this.mail.sendPasswordResetEmail(email, link, name);
  }
}
