// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthTokensService } from './tokens/token.service';
import { EnvVars } from 'src/config/config.schema';
import { PasswordResetService } from './password-reset/password-reset.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<EnvVars>): JwtModuleOptions => {
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
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthTokensService,
    PasswordResetService,
  ],
  exports: [AuthTokensService],
})
export class AuthModule {}
