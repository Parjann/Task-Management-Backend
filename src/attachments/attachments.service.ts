import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, ProjectRole } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { ActivityQueueService } from '../infrastructure/queues/activity/activity.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityQueueService: ActivityQueueService,
  ) {}

  async upload(userId: string, taskId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // File may already be unlinked
        }
      }
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(this.prisma, task.projectId, userId);

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    const fileUrl = `/uploads/${file.filename}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        taskId,
        uploadedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.activityQueueService.createActivity({
      taskId,
      userId,
      action: ActivityAction.ATTACHMENT_UPLOADED,
      message: `Attached file "${file.originalname}"`,
    });

    return attachment;
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

    return this.prisma.attachment.findMany({
      where: {
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(userId: string, id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: {
        id,
      },
      include: {
        task: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.uploadedBy !== userId) {
      const member = await getProjectMember(
        this.prisma,
        attachment.task.projectId,
        userId,
      );

      checkProjectPermission(member.role, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
      ]);
    }

    // Delete file from disk
    const filename = attachment.fileUrl.replace(/^\/uploads\//, '');
    const diskPath = join(process.cwd(), 'uploads', filename);
    if (existsSync(diskPath)) {
      try {
        unlinkSync(diskPath);
      } catch {
        // File may already be unlinked
      }
    }

    await this.prisma.attachment.delete({
      where: {
        id,
      },
    });

    await this.activityQueueService.createActivity({
      taskId: attachment.taskId,
      userId,
      action: ActivityAction.ATTACHMENT_DELETED,
      message: `Removed attachment "${attachment.fileName}"`,
    });

    return {
      message: 'Attachment deleted successfully',
    };
  }
}
