import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ReservationStatus, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { RequestUser } from 'src/types/request-user';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Reservations')
@ApiBearerAuth('access-token')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ReservationStatus,
  })
  list(@Req() req: RequestUser, @Query('status') status?: ReservationStatus) {
    return this.reservations.list(req.user!.sub, req.user!.role!, status);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)
  getById(@Req() req: RequestUser, @Param('id') id: string) {
    return this.reservations.getById(id, req.user!.sub, req.user!.role!);
  }

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)
  create(@Req() req: RequestUser, @Body() dto: CreateReservationDto) {
    return this.reservations.create(req.user!.sub, req.user!.role!, dto);
  }

  @Patch(':id')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)
  update(
    @Req() req: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservations.update(id, req.user!.role!, dto);
  }

  @Post(':id/payments')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)
  addPayment(
    @Req() req: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.reservations.recordPayment(id, req.user!.role!, dto);
  }
}
