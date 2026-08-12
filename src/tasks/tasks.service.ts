import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActivityAction } from '@prisma/client';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { ProjectRole } from '@prisma/client';


@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    // Check project exists
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await getProjectMember(
        this.prisma,
        dto.projectId,
        userId,
    );

    checkProjectPermission(member.role, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
    ]);

    const assigneeMember = await this.prisma.projectMember.findFirst({
        where: {
            projectId: dto.projectId,
            userId: dto.assigneeId,
        },
    });

    if (!assigneeMember) {
        throw new BadRequestException(
            'Assignee is not a member of this project',
        );
    }

    const reporterMember = await this.prisma.projectMember.findFirst({
       where: {
           projectId: dto.projectId,
           userId: dto.reporterId,
        },
    });

    if (!reporterMember) {
        throw new BadRequestException(
            'Reporter is not a member of this project',
        );
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: dto.title,
          description: dto.description,

          projectId: dto.projectId,

          creatorId: userId,

          reporterId: dto.reporterId,

          assigneeId: dto.assigneeId,

          priority: dto.priority,

          status: dto.status,

          dueDate: dto.dueDate
            ? new Date(dto.dueDate)
            : null,

          orderIndex: dto.orderIndex ?? 0,
        },
      });

      await tx.activity.create({
        data: {
          taskId: task.id,

          userId,

          action: ActivityAction.TASK_CREATED,

          message: `Task "${task.title}" created`,
        },
      });

      return task;
    });
  }
}