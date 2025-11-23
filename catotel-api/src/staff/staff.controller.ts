import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { StaffService } from './staff.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { RequestUser } from 'src/types/request-user';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@ApiTags('Staff')
@ApiBearerAuth('access-token')
@Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('tasks')
  listTasks(@Req() req: RequestUser) {
    return this.staff.listTasks(req.user!.sub, req.user!.role!);
  }

  @Patch('tasks/:id/status')
  updateStatus(
    @Req() req: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.staff.updateTaskStatus(id, req.user!.sub, req.user!.role!, dto);
  }
}
