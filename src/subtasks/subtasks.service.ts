import { Injectable, NotFoundException } from '@nestjs/common';

import { ActivityAction, ProjectRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { WebsocketService } from '../websocket/websocket.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Injectable()
export class SubtasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketService: WebsocketService,
  ) {}

  async create(userId: string, taskId: string, dto: CreateSubtaskDto) {
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

    const count = await this.prisma.subtask.count({
      where: {
        taskId,
      },
    });

    const subtask = await this.prisma.$transaction(async (tx) => {
      const createdSubtask = await tx.subtask.create({
        data: {
          title: dto.title,
          taskId,
          orderIndex: count,
        },
      });

      await tx.activity.create({
        data: {
          taskId,
          userId,
          action: ActivityAction.SUBTASK_CREATED,
          message: `Subtask "${createdSubtask.title}" created`,
        },
      });

      return createdSubtask;
    });

    this.websocketService.emitToProject(
      task.projectId,
      'subtask.created',
      subtask,
    );

    return subtask;
  }

  async findAll(userId: string, taskId: string) {
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
      ProjectRole.VIEWER,
    ]);

    return this.prisma.subtask.findMany({
      where: {
        taskId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateSubtaskDto) {
    const subtask = await this.prisma.subtask.findUnique({
      where: {
        id,
      },
      include: {
        task: true,
      },
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    const member = await getProjectMember(
      this.prisma,
      subtask.task.projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    const updatedSubtask = await this.prisma.subtask.update({
      where: {
        id,
      },
      data: dto,
    });

    this.websocketService.emitToProject(
      subtask.task.projectId,
      'subtask.updated',
      updatedSubtask,
    );

    return updatedSubtask;
  }

  async remove(userId: string, id: string) {
    const subtask = await this.prisma.subtask.findUnique({
      where: {
        id,
      },
      include: {
        task: true,
      },
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    const member = await getProjectMember(
      this.prisma,
      subtask.task.projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    await this.prisma.subtask.delete({
      where: {
        id,
      },
    });

    this.websocketService.emitToProject(
      subtask.task.projectId,
      'subtask.deleted',
      {
        id,
        taskId: subtask.taskId,
      },
    );

    return {
      message: 'Subtask deleted successfully',
    };
  }
}
