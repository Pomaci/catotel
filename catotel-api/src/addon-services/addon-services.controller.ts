import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AddonServicesService } from './addon-services.service';
import {
  AddonServiceDto,
  CreateAddonServiceDto,
  UpdateAddonServiceDto,
} from './dto/addon-service.dto';

@ApiTags('Addon Services')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.CUSTOMER)
@Controller('addon-services')
export class AddonServicesController {
  constructor(private readonly addonServices: AddonServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List active addon services' })
  @ApiOkResponse({ type: AddonServiceDto, isArray: true })
  listActive() {
    return this.addonServices.listActive();
  }
}

@ApiTags('Admin Addon Services')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/addon-services')
export class AdminAddonServicesController {
  constructor(private readonly addonServices: AddonServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all addon services' })
  @ApiOkResponse({ type: AddonServiceDto, isArray: true })
  listAll() {
    return this.addonServices.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create an addon service' })
  @ApiCreatedResponse({ type: AddonServiceDto })
  create(@Body() dto: CreateAddonServiceDto) {
    return this.addonServices.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an addon service' })
  @ApiOkResponse({ type: AddonServiceDto })
  update(@Param('id') id: string, @Body() dto: UpdateAddonServiceDto) {
    return this.addonServices.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an addon service' })
  @ApiOkResponse({ type: Boolean })
  async remove(@Param('id') id: string) {
    await this.addonServices.remove(id);
    return true;
  }
}
