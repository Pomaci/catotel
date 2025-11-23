import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { RequestUser } from 'src/types/request-user';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Roles(UserRole.CUSTOMER, UserRole.MANAGER, UserRole.ADMIN)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get('me')
  async getMe(@Req() req: RequestUser) {
    return this.customers.getProfile(req.user!.sub);
  }

  @Patch('me')
  async updateProfile(@Req() req: RequestUser, @Body() dto: UpdateCustomerDto) {
    return this.customers.updateProfile(req.user!.sub, dto);
  }

  @Get('cats')
  async listCats(@Req() req: RequestUser) {
    return this.customers.listCats(req.user!.sub);
  }

  @Post('cats')
  async createCat(@Req() req: RequestUser, @Body() dto: CreateCatDto) {
    return this.customers.createCat(req.user!.sub, dto);
  }

  @Patch('cats/:id')
  async updateCat(
    @Req() req: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCatDto,
  ) {
    return this.customers.updateCat(req.user!.sub, id, dto);
  }
}
