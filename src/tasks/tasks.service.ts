import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ActivityAction } from '@prisma/client';

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

    // Only project owner can create tasks (we'll improve this later)
    if (project.ownerId !== userId) {
      throw new BadRequestException(
        'You are not allowed to create tasks in this project',
      );
    }

    // Validate assignee
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: {
          id: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    // Validate reporter
    if (dto.reporterId) {
      const reporter = await this.prisma.user.findUnique({
        where: {
          id: dto.reporterId,
        },
      });

      if (!reporter) {
        throw new NotFoundException('Reporter not found');
      }
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