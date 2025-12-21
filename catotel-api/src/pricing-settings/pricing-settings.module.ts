import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PricingSettingsController } from './pricing-settings.controller';
import { PricingSettingsService } from './pricing-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [PricingSettingsController],
  providers: [PricingSettingsService],
  exports: [PricingSettingsService],
})
export class PricingSettingsModule {}
