import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { loadAndValidateEnv } from './config/env.loader';
import { EnvVars } from './config/config.schema';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './auth/jwt/jwt.guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CustomersModule } from './customers/customers.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReservationsModule } from './reservations/reservations.module';
import { StaffModule } from './staff/staff.module';
import { MailModule } from './mail/mail.module';
import { PricingSettingsModule } from './pricing-settings/pricing-settings.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { AddonServicesModule } from './addon-services/addon-services.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: loadAndValidateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars>): ThrottlerModuleOptions => {
        const rawTtl: unknown = config.get('RATE_LIMIT_TTL', { infer: true });
        const rawLimit: unknown = config.get('RATE_LIMIT_LIMIT', {
          infer: true,
        });
        const ttl =
          typeof rawTtl === 'number' && Number.isFinite(rawTtl) ? rawTtl : 60;
        const limit =
          typeof rawLimit === 'number' && Number.isFinite(rawLimit)
            ? rawLimit
            : 120;

        return {
          throttlers: [
            {
              ttl,
              limit,
            },
          ],
        };
      },
    }),
    HealthModule,
    AuthModule,
    UserModule,
    PrismaModule,
    CustomersModule,
    RoomTypesModule,
    RoomsModule,
    ReservationsModule,
    StaffModule,
    MailModule,
    PricingSettingsModule,
    AddonServicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
