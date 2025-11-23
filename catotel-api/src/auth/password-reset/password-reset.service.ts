import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { EnvVars } from 'src/config/config.schema';
import { randomUUID, createHash } from 'crypto';
import { addMinutes } from 'date-fns';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  private readonly resetUrl: string;
  private readonly tokenTtlMinutes: number;
  private readonly passwordSaltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly mail: MailService,
    private readonly config: ConfigService<EnvVars>,
  ) {
    this.resetUrl =
      this.config.get('PASSWORD_RESET_URL', { infer: true }) ??
      'http://localhost:3100/auth/reset-password';
    this.tokenTtlMinutes =
      this.config.get('PASSWORD_RESET_TOKEN_TTL_MINUTES', { infer: true }) ??
      30;
  }

  async requestPasswordReset(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return;
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomUUID();
    const tokenHash = this.digestToken(token);
    const expiresAt = addMinutes(new Date(), this.tokenTtlMinutes);

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

  private digestToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
