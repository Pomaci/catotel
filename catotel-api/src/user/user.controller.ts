import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import type { Request } from 'express';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserProfileDto } from './dto/user-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerSearchDto } from './dto/customer-search.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Register a new Catotel account' })
  @ApiCreatedResponse({ type: UserProfileDto })
  @Public()
  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    return this.userService.register(body);
  }

  @ApiOperation({ summary: 'Return the authenticated user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiBearerAuth('access-token')
  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new NotFoundException('User ID not found in token');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { id, email, name, role, customer, staff } = user;
    return {
      id,
      email,
      name,
      role,
      customer: customer
        ? {
            id: customer.id,
            phone: customer.phone,
            address: customer.address,
          }
        : null,
      staff: staff
        ? {
            id: staff.id,
            phone: staff.phone,
            position: staff.position,
          }
        : null,
    };
  }

  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @Get()
  async listUsers() {
    return this.userService.listUsers();
  }

  @ApiOperation({ summary: 'Create a staff/manager/admin account' })
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @Post('management')
  async createManagedUser(@Body() body: CreateManagedUserDto) {
    return this.userService.createManagedUser(body);
  }

  @ApiOperation({ summary: 'Create a customer account (staff/admin)' })
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Post('customers')
  async createCustomer(@Body() body: CreateCustomerDto) {
    return this.userService.createCustomerAsStaff(body);
  }

  @ApiOperation({ summary: 'Search customers by email/phone/name' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: [CustomerSearchDto] })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Get('customers/search')
  async searchCustomers(@Req() req: Request) {
    const query = (req.query.q as string) ?? '';
    return this.userService.searchCustomers(query);
  }

  @ApiOperation({ summary: 'Update user role' })
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return this.userService.updateUserRole(id, body.role);
  }
}
