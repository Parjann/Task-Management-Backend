import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { ActivityAction, Prisma, ProjectRole } from '@prisma/client';

import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { WebsocketService } from '../websocket/websocket.service';
import { ActivityQueueService } from '../infrastructure/queues/activity/activity.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketService: WebsocketService,
    private readonly activityQueueService: ActivityQueueService,
  ) {}

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

    // Check project permission
    const member = await getProjectMember(this.prisma, dto.projectId, userId);

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    // Validate assignee
    if (dto.assigneeId) {
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
    }

    // Validate reporter
    if (dto.reporterId) {
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
    }

    const createdTask = await this.prisma.$transaction(async (tx) => {
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

          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,

          orderIndex: dto.orderIndex ?? 0,
        },

        include: {
          creator: true,
          reporter: true,
          assignee: true,
          project: true,
        },
      });

      return task;
    });

    await this.activityQueueService.createActivity({
      taskId: createdTask.id,
      userId,
      action: ActivityAction.TASK_CREATED,
      message: `Task "${createdTask.title}" created`,
    });

    this.websocketService.emitToProject(
      createdTask.projectId,
      'task.created',
      createdTask,
    );

    return createdTask;
  }

  async findAll(userId: string, query: GetTasksDto) {
    if (query.projectId) {
      // Check project exists
      const project = await this.prisma.project.findUnique({
        where: {
          id: query.projectId,
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check membership
      const member = await getProjectMember(this.prisma, query.projectId, userId);

      checkProjectPermission(member.role, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
        ProjectRole.VIEWER,
      ]);
    }

    // Dynamic filters
    const where: Prisma.TaskWhereInput = query.projectId
      ? { projectId: query.projectId }
      : {
          project: {
            members: {
              some: {
                userId,
              },
            },
          },
        };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const total = await this.prisma.task.count({
      where,
    });

    const tasks = await this.prisma.task.findMany({
      where,

      skip: (query.page - 1) * query.limit,

      take: query.limit,

      orderBy: {
        [query.sortBy]: query.sortOrder,
      },

      include: {
        creator: true,

        reporter: true,

        assignee: true,

        labels: {
          include: {
            label: true,
          },
        },

        _count: {
          select: {
            comments: true,
            subtasks: true,
          },
        },
      },
    });

    return {
      data: tasks,

      meta: {
        page: query.page,

        limit: query.limit,

        total,

        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        creator: true,

        reporter: true,

        assignee: true,

        project: true,

        labels: {
          include: {
            label: true,
          },
        },

        subtasks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },

        comments: {
          include: {
            user: true,
          },

          orderBy: {
            createdAt: 'asc',
          },
        },

        activities: {
          include: {
            user: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },

        attachments: {
          include: {
            user: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(this.prisma, task.projectId, userId);

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ]);

    const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
    const totalSubtasks = task.subtasks.length;

    return {
      ...task,
      subtasksProgress: {
        completed: completedSubtasks,
        total: totalSubtasks,
        percentage:
          totalSubtasks > 0
            ? Math.round((completedSubtasks / totalSubtasks) * 100)
            : 0,
      },
    };
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(this.prisma, task.projectId, userId);

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    if (dto.assigneeId) {
      const assignee = await this.prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: dto.assigneeId,
        },
      });

      if (!assignee) {
        throw new BadRequestException(
          'Assignee is not a member of this project',
        );
      }
    }

    if (dto.reporterId) {
      const reporter = await this.prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: dto.reporterId,
        },
      });

      if (!reporter) {
        throw new BadRequestException(
          'Reporter is not a member of this project',
        );
      }
    }

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: {
          id: taskId,
        },

        data: {
          ...dto,

          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },

        include: {
          creator: true,
          reporter: true,
          assignee: true,
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      return updated;
    });

    await this.activityQueueService.createActivity({
      taskId,
      userId,
      action: ActivityAction.TASK_UPDATED,
      message: `Task "${updatedTask.title}" updated`,
    });

    this.websocketService.emitToProject(
      task.projectId,
      'task.updated',
      updatedTask,
    );

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(this.prisma, task.projectId, userId);

    checkProjectPermission(member.role, [ProjectRole.OWNER, ProjectRole.ADMIN]);

    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    await this.activityQueueService.createActivity({
      taskId: task.id,
      userId,
      action: ActivityAction.TASK_DELETED,
      message: `Task "${task.title}" deleted`,
    });

    this.websocketService.emitToProject(task.projectId, 'task.deleted', {
      id: taskId,
      projectId: task.projectId,
    });

    return {
      message: 'Task deleted successfully',
    };
  }

  async move(userId: string, taskId: string, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(this.prisma, task.projectId, userId);

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    const oldStatus = task.status;

    const updatedTask = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: dto.status,
        orderIndex: dto.orderIndex,
      },
    });

    if (oldStatus !== dto.status) {
      await this.activityQueueService.createActivity({
        taskId,
        userId,
        action: ActivityAction.STATUS_CHANGED,
        message: `Status changed from ${oldStatus} to ${dto.status}`,
      });
    }

    this.websocketService.emitToProject(
      task.projectId,
      'task.moved',
      updatedTask,
    );

    return updatedTask;
  }
}
