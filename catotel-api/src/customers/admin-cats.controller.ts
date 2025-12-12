import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole, CatGender } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import {
  AdminCatDetailDto,
  AdminCatListResponseDto,
} from './dto/admin-cat.dto';
import { IsString } from 'class-validator';

class CreateAdminCatDto extends CreateCatDto {
  @ApiProperty({ description: 'Customer profile ID' })
  @IsString()
  customerId!: string;
}

@ApiTags('Admin Cats')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
@Controller('admin/cats')
export class AdminCatsController {
  constructor(private readonly customers: CustomersService) {}

  @ApiOperation({ summary: 'List cats with owner info' })
  @Get()
  async list(
    @Query('search') search?: string,
    @Query('gender') gender?: CatGender,
    @Query('neutered') neutered?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ): Promise<AdminCatListResponseDto> {
    return this.customers.listAdminCats({
      search,
      gender,
      isNeutered:
        typeof neutered === 'string' ? neutered === 'true' : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      sortDir,
    });
  }

  @ApiOperation({ summary: 'Get cat detail with owner info' })
  @Get(':id')
  async get(@Param('id') id: string): Promise<AdminCatDetailDto> {
    return this.customers.getAdminCat(id);
  }

  @ApiOperation({ summary: 'Create cat for a customer' })
  @Post()
  async create(@Body() dto: CreateAdminCatDto) {
    return this.customers.createAdminCat(dto);
  }

  @ApiOperation({ summary: 'Update cat' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCatDto) {
    return this.customers.updateAdminCat(id, dto);
  }
}
