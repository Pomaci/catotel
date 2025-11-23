import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import { EnvVars } from 'src/config/config.schema';

export interface JwtRuntimeConfig {
  secret: string;
  signOptions: {
    expiresIn: JwtSignOptions['expiresIn'];
    issuer: string;
    audience: string;
  };
}

export const getAccessJwtConfig = (
  cfg: ConfigService<EnvVars>,
): JwtRuntimeConfig => {
  const ttl = cfg.getOrThrow<string>('ACCESS_TOKEN_TTL');
  const issuer = cfg.getOrThrow<string>('JWT_ISSUER');
  const audience = cfg.getOrThrow<string>('JWT_AUDIENCE');

  return {
    secret: cfg.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    signOptions: {
      expiresIn: ttl as JwtSignOptions['expiresIn'],
      issuer,
      audience,
    },
  };
};

export const getRefreshJwtConfig = (
  cfg: ConfigService<EnvVars>,
): JwtRuntimeConfig => {
  const ttl = cfg.getOrThrow<string>('REFRESH_TOKEN_TTL');
  const issuer = cfg.getOrThrow<string>('JWT_ISSUER');
  const audience = cfg.getOrThrow<string>('JWT_AUDIENCE');

  return {
    secret: cfg.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
    signOptions: {
      expiresIn: ttl as JwtSignOptions['expiresIn'],
      issuer,
      audience,
    },
  };
};
