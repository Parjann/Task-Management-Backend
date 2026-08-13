import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  InvitationStatus,
  NotificationType,
  ProjectRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { WebsocketService } from '../websocket/websocket.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly websocketService: WebsocketService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, projectId: string, dto: CreateInvitationDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await getProjectMember(this.prisma, projectId, userId);
    checkProjectPermission(member.role, [ProjectRole.OWNER, ProjectRole.ADMIN]);

    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (targetUser) {
      const existingMember = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: targetUser.id,
        },
      });

      if (existingMember) {
        throw new BadRequestException(
          'User is already a member of this project',
        );
      }
    }

    // Check if an active pending invitation already exists
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        projectId,
        email: dto.email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'An active invitation has already been sent to this email',
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const inviter = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        projectId,
        inviterId: userId,
        expiresAt,
      },
      include: {
        project: true,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invitations/${token}`;

    await this.mailService.sendProjectInvitation({
      to: dto.email.toLowerCase(),
      inviterName: inviter?.name || 'A team member',
      projectName: project.name,
      role: dto.role,
      inviteUrl,
    });

    // Also notify if user already has an account
    if (targetUser) {
      await this.notificationsService.create({
        userId: targetUser.id,
        title: 'Project Invitation',
        message: `${inviter?.name || 'Someone'} invited you to join ${project.name}`,
        type: NotificationType.PROJECT_INVITATION,
        projectId: project.id,
      });
    }

    return invitation;
  }

  async findAllByProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await getProjectMember(this.prisma, projectId, userId);
    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    return this.prisma.invitation.findMany({
      where: {
        projectId,
      },
      include: {
        inviter: {
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

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        token,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            color: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      if (invitation.status === InvitationStatus.PENDING) {
        await this.prisma.invitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: InvitationStatus.EXPIRED,
          },
        });
      }
      throw new BadRequestException('This invitation has expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    return invitation;
  }

  async accept(userId: string, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        token,
      },
      include: {
        project: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: InvitationStatus.ACCEPTED,
        },
      });

      await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: invitation.projectId,
            userId,
          },
        },
        create: {
          projectId: invitation.projectId,
          userId,
          role: invitation.role,
        },
        update: {
          role: invitation.role,
        },
      });
    });

    // Notify inviter that invitation was accepted
    await this.notificationsService.create({
      userId: invitation.inviterId,
      title: 'Invitation Accepted',
      message: `${user.name || user.email} joined ${invitation.project.name}`,
      type: NotificationType.MEMBER_ADDED,
      projectId: invitation.projectId,
    });

    // Broadcast member joined event to project room
    this.websocketService.emitToProject(invitation.projectId, 'member.joined', {
      projectId: invitation.projectId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      role: invitation.role,
    });

    return {
      success: true,
      message: 'Invitation accepted successfully',
      projectId: invitation.projectId,
    };
  }

  async reject(userId: string, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        token,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    await this.prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: InvitationStatus.REJECTED,
      },
    });

    return {
      success: true,
      message: 'Invitation rejected',
    };
  }

  async remove(userId: string, id: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const member = await getProjectMember(
      this.prisma,
      invitation.projectId,
      userId,
    );

    checkProjectPermission(member.role, [ProjectRole.OWNER, ProjectRole.ADMIN]);

    await this.prisma.invitation.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Invitation deleted successfully',
    };
  }
}
