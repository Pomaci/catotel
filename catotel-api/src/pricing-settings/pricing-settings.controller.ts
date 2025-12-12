import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PricingSettingsService } from './pricing-settings.service';
import {
  PricingSettingsResponseDto,
  UpdatePricingSettingsDto,
} from './dto/pricing-settings.dto';

@ApiTags('Admin Pricing Settings')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiExtraModels(PricingSettingsResponseDto)
@Controller('admin/pricing-settings')
export class PricingSettingsController {
  constructor(private readonly pricingSettings: PricingSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get pricing and discount configuration' })
  @ApiOkResponse({
    description: 'Pricing settings or null if not configured',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(PricingSettingsResponseDto) },
        { type: 'null' },
      ],
    },
  })
  async getSettings(): Promise<PricingSettingsResponseDto | null> {
    return this.pricingSettings.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Create or update pricing settings' })
  @ApiOkResponse({ type: PricingSettingsResponseDto })
  updateSettings(
    @Body() dto: UpdatePricingSettingsDto,
  ): Promise<PricingSettingsResponseDto> {
    return this.pricingSettings.updateSettings(dto);
  }
}
