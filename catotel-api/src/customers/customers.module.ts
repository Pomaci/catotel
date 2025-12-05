import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCatsController } from './admin-cats.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController, AdminCustomersController, AdminCatsController],
  providers: [CustomersService],
})
export class CustomersModule {}
