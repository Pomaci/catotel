import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomAssignmentService } from './room-assignment.service';
import { PricingSettingsModule } from 'src/pricing-settings/pricing-settings.module';

@Module({
  imports: [PrismaModule, PricingSettingsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, RoomAssignmentService],
})
export class ReservationsModule {}
