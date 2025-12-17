import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { EnvVars } from 'src/config/config.schema';
import { DEFAULT_PASSWORD_RESET_URL } from 'src/config/defaults';
import { randomUUID, createHash } from 'crypto';
import { addMinutes, subMinutes } from 'date-fns';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly resetUrl: string;
  private readonly tokenTtlMinutes: number;
  private readonly resetRequestLimit: number;
  private readonly resetRequestWindowMinutes: number;
  private readonly passwordSaltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly mail: MailService,
    private readonly config: ConfigService<EnvVars>,
  ) {
    this.resetUrl =
      this.config.get('PASSWORD_RESET_URL', { infer: true }) ??
      DEFAULT_PASSWORD_RESET_URL;
    this.tokenTtlMinutes =
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

  async requestPasswordReset(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return;
    }

    await this.ensureResetRequestAllowed(user.id);

    const now = new Date();

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });

    const token = randomUUID();
    const tokenHash = this.digestToken(token);
    const expiresAt = addMinutes(now, this.tokenTtlMinutes);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetLink = `${this.resetUrl}${
      this.resetUrl.includes('?') ? '&' : '?'
    }token=${token}`;
    await this.mail.sendPasswordResetEmail(
      user.email,
      resetLink,
      user.name ?? undefined,
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.digestToken(token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      this.passwordSaltRounds,
    );
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          password: hashedPassword,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: {
          usedAt: now,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId },
        data: {
          isRevoked: true,
          updatedAt: now,
        },
      }),
    ]);
  }

  private async ensureResetRequestAllowed(userId: string) {
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
}
