import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityAction, ProjectRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { WebsocketService } from '../websocket/websocket.service';
import { ActivityQueueService } from '../infrastructure/queues/activity/activity.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketService: WebsocketService,
    private readonly activityQueueService: ActivityQueueService,
  ) {}

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
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

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId,
        userId,
      },
      include: {
        user: true,
      },
    });

    await this.activityQueueService.createActivity({
      taskId,
      userId,
      action: ActivityAction.COMMENT_ADDED,
      message: 'Comment added',
    });

    this.websocketService.emitToProject(
      task.projectId,
      'comment.created',
      comment,
    );

    return comment;
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

    return this.prisma.comment.findMany({
      where: {
        taskId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      include: {
        task: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments.');
    }

    const updatedComment = await this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: dto,
      include: {
        user: true,
      },
    });

    this.websocketService.emitToProject(
      comment.task.projectId,
      'comment.updated',
      updatedComment,
    );

    return updatedComment;
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      include: {
        task: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      const member = await getProjectMember(
        this.prisma,
        comment.task.projectId,
        userId,
      );

      checkProjectPermission(member.role, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
      ]);
    }

    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    this.websocketService.emitToProject(
      comment.task.projectId,
      'comment.deleted',
      {
        id: commentId,
        taskId: comment.taskId,
      },
    );

    return {
      message: 'Comment deleted successfully',
    };
  }
}
