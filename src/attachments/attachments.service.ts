import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, ProjectRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { ActivityQueueService } from '../infrastructure/queues/activity/activity.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityQueueService: ActivityQueueService,
    private readonly cloudinaryService: CloudinaryService,
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
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(this.prisma, task.projectId, userId);

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    // Stream upload directly to Cloudinary
    const cloudinaryResponse = await this.cloudinaryService.uploadFile(
      file,
      `task-management/projects/${task.projectId}/tasks/${taskId}`,
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileUrl: cloudinaryResponse.secureUrl,
        publicId: cloudinaryResponse.publicId,
        mimeType: file.mimetype,
        fileSize: cloudinaryResponse.bytes,
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

    // Delete from Cloudinary if publicId exists
    if (attachment.publicId) {
      await this.cloudinaryService.deleteFile(
        attachment.publicId,
        attachment.mimeType.startsWith('image/') ? 'image' : 'raw',
      );
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
