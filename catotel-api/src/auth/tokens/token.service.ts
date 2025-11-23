import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  getAccessJwtConfig,
  getRefreshJwtConfig,
  JwtRuntimeConfig,
} from '../config/jwt.config';
import { JwtPayload } from 'src/types/jwt-payload';
import { EnvVars } from 'src/config/config.schema';

export type TokenPayload = Pick<JwtPayload, 'sub' | 'email' | 'role'>;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthTokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvVars>,
  ) {}

  private getAccessRuntimeConfig(): JwtRuntimeConfig {
    return getAccessJwtConfig(this.configService);
  }

  private getRefreshRuntimeConfig(): JwtRuntimeConfig {
    return getRefreshJwtConfig(this.configService);
  }

  private toVerifyOptions(cfg: JwtRuntimeConfig): JwtVerifyOptions {
    return {
      secret: cfg.secret,
      issuer: cfg.signOptions.issuer,
      audience: cfg.signOptions.audience,
    };
  }

  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  private async signAccessToken(payload: TokenPayload): Promise<string> {
    const cfg = this.getAccessRuntimeConfig();
    return this.jwtService.signAsync(payload, {
      ...cfg.signOptions,
      jwtid: randomUUID(),
      secret: cfg.secret,
    });
  }

  private async signRefreshToken(payload: TokenPayload): Promise<string> {
    const cfg = this.getRefreshRuntimeConfig();
    return this.jwtService.signAsync(payload, {
      ...cfg.signOptions,
      jwtid: randomUUID(),
      secret: cfg.secret,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    const cfg = this.getAccessRuntimeConfig();
    return this.jwtService.verify<JwtPayload>(token, this.toVerifyOptions(cfg));
  }

  verifyRefreshToken(token: string): JwtPayload {
    const cfg = this.getRefreshRuntimeConfig();
    return this.jwtService.verify<JwtPayload>(token, this.toVerifyOptions(cfg));
  }
}
