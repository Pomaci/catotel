import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  AdminCustomerListResponseDto,
} from './dto/admin-customer-list.dto';

@ApiTags('Admin Customers')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(private readonly customers: CustomersService) {}

  @ApiOperation({ summary: 'List customers with pagination and filters' })
  @Get()
  async list(
    @Query('search') search?: string,
    @Query('status') status?: 'ACTIVE' | 'INACTIVE',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ): Promise<AdminCustomerListResponseDto> {
    return this.customers.listAdminCustomers({
      search,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      sortDir,
    });
  }

  @ApiOperation({ summary: 'Delete a customer and related data' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.customers.deleteCustomer(id);
  }
}
