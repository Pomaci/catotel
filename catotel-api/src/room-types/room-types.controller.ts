import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { RoomTypesService } from './room-types.service';

@ApiTags('Room Types')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypes: RoomTypesService) {}

  @Get()
  @Public()
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'checkIn', required: false, type: String })
  @ApiQuery({ name: 'checkOut', required: false, type: String })
  @ApiQuery({ name: 'partySize', required: false, type: Number })
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('partySize') partySize?: string,
  ) {
    const activeOnly = includeInactive !== 'true';
    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      throw new BadRequestException('Both checkIn and checkOut are required');
    }
    const requestedPartySize =
      partySize && !Number.isNaN(Number(partySize))
        ? Number(partySize)
        : undefined;
    if (partySize && requestedPartySize === undefined) {
      throw new BadRequestException('partySize must be a number');
    }
    if (checkIn && checkOut) {
      return this.roomTypes.listWithAvailability(
        checkIn,
        checkOut,
        activeOnly,
        requestedPartySize,
      );
    }
    return this.roomTypes.list(activeOnly);
  }

  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateRoomTypeDto) {
    return this.roomTypes.create(dto);
  }

  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.roomTypes.update(id, dto);
  }
}
