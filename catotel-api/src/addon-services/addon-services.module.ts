import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import {
  AddonServicesController,
  AdminAddonServicesController,
} from './addon-services.controller';
import { AddonServicesService } from './addon-services.service';

@Module({
  imports: [PrismaModule],
  controllers: [AddonServicesController, AdminAddonServicesController],
  providers: [AddonServicesService],
  exports: [AddonServicesService],
})
export class AddonServicesModule {}
