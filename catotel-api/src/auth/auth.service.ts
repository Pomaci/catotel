import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Session } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/types/jwt-payload';
import { AuthTokensService } from './tokens/token.service';
import { UserService } from 'src/user/user.service';
import { EnvVars } from 'src/config/config.schema';

@Injectable()
export class AuthService {
  private readonly maxSessionsPerUser: number;
  private readonly refreshSaltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: AuthTokensService,
    private readonly userService: UserService,
    private readonly configService: ConfigService<EnvVars>,
  ) {
    const rawLimit: unknown = this.configService.get('MAX_SESSIONS_PER_USER', {
      infer: true,
    });
    this.maxSessionsPerUser =
      typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : 3;
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ip?: string,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } =
      await this.tokens.generateTokenPair(payload);
    const refreshPayload = this.tokens.verifyRefreshToken(refreshToken);

    await this.createSession(user.id, {
      refreshToken,
      userAgent,
      ip,
      expiresAt: this.getExpirationDate(refreshPayload),
    });
    await this.cleanupExpiredSessions();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(rawRefreshToken: string) {
    const payload = this.validateRefreshToken(rawRefreshToken);
    const session = await this.findSessionByToken(payload.sub, rawRefreshToken);
    if (!session) {
      throw new ForbiddenException('Invalid or expired token');
    }

    const { accessToken, refreshToken } = await this.tokens.generateTokenPair({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
    const refreshPayload = this.tokens.verifyRefreshToken(refreshToken);

    await this.rotateSession(session.id, refreshToken, refreshPayload);
    await this.cleanupExpiredSessions();

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async logout(rawRefreshToken: string) {
    const payload = this.validateRefreshToken(rawRefreshToken);
    const session = await this.findSessionByToken(payload.sub, rawRefreshToken);
    if (!session) {
      throw new UnauthorizedException(
        'Session not found or already logged out',
      );
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true, updatedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true, updatedAt: new Date() },
    });
    return { message: 'Logged out from all devices' };
  }

  private async cleanupExpiredSessions() {
    await this.prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async handleSessionCleanup() {
    await this.cleanupExpiredSessions();
    console.log('[CRON] Old or revoked sessions cleaned up.');
  }

  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Cannot revoke this session');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  //transaction dönüş değeri yok işlem başarısız olursa nasıl başa çıkılmalı
  private async createSession(
    userId: string,
    params: {
      refreshToken: string;
      userAgent?: string;
      ip?: string;
      expiresAt: Date;
    },
  ) {
    const hashedRefresh = await this.hashToken(params.refreshToken);
    await this.prisma.$transaction(async (tx) => {
      const activeSessions = await tx.session.findMany({
        where: { userId, isRevoked: false },
        orderBy: { createdAt: 'asc' },
      });

      const overflow = activeSessions.length - this.maxSessionsPerUser + 1;
      if (overflow > 0) {
        const toRevoke = activeSessions.slice(0, overflow).map((s) => s.id);
        await tx.session.updateMany({
          where: { id: { in: toRevoke } },
          data: { isRevoked: true, updatedAt: new Date() },
        });
      }

      await tx.session.create({
        data: {
          userId,
          refreshToken: hashedRefresh,
          userAgent: params.userAgent ?? 'Unknown',
          ip: params.ip ?? 'Unknown',
          expiresAt: params.expiresAt,
          lastUsedAt: new Date(),
        },
      });
    });
  }

  private async findSessionByToken(
    userId: string,
    rawRefreshToken: string,
  ): Promise<Session | null> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    const candidate = this.digestToken(rawRefreshToken);
    for (const session of sessions) {
      const match = await bcrypt.compare(candidate, session.refreshToken);
      if (match) {
        return session;
      }
    }

    return null;
  }

  private async rotateSession(
    sessionId: string,
    newRefreshToken: string,
    payload: JwtPayload,
  ) {
    const hashed = await this.hashToken(newRefreshToken);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: hashed,
        updatedAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: this.getExpirationDate(payload),
        isRevoked: false,
      },
    });
  }

  private async hashToken(token: string) {
    return bcrypt.hash(this.digestToken(token), this.refreshSaltRounds);
  }

  private getExpirationDate(payload: JwtPayload) {
    if (!payload.exp) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return new Date(payload.exp * 1000);
  }

  private validateRefreshToken(rawRefreshToken: string): JwtPayload {
    try {
      return this.tokens.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private digestToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
