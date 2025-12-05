import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CareTaskStatus, UserRole } from '@prisma/client';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { publicUserSelect } from 'src/user/public-user.select';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async listTasks(userId: string, role: UserRole) {
    const where =
      role === UserRole.STAFF ? { assignedStaff: { userId } } : undefined;
    return this.prisma.careTask.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        cat: true,
        reservation: {
          include: {
            roomType: true,
            customer: { include: { user: { select: publicUserSelect } } },
          },
        },
        assignedStaff: { include: { user: { select: publicUserSelect } } },
      },
      take: 100,
    });
  }

  async updateTaskStatus(
    id: string,
    userId: string,
    role: UserRole,
    dto: UpdateTaskStatusDto,
  ) {
    const task = await this.prisma.careTask.findUnique({
      where: { id },
      include: { assignedStaff: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (role === UserRole.STAFF && task.assignedStaff?.userId !== userId) {
      throw new ForbiddenException(
        'This task is assigned to another staff member',
      );
    }
    const now = new Date();
    return this.prisma.careTask.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes ?? task.notes,
        completedAt:
          dto.status === CareTaskStatus.DONE ? now : task.completedAt,
      },
    });
  }
}
