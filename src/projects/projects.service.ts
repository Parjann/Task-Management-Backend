import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, dto: CreateProjectDto) {
    const existingProject = await this.prisma.project.findUnique({
      where: {
        key: dto.key.toUpperCase(),
      },
    });

    if (existingProject) {
      throw new BadRequestException('Project key already exists');
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        key: dto.key.toUpperCase(),
        description: dto.description,
        color: dto.color,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        ownerId: userId,

        members: {
          create: {
            userId,
            role: ProjectRole.OWNER,
          },
        },
      },

      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (
      !member ||
      (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.ADMIN)
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this project',
      );
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.key !== undefined ? { key: dto.key.toUpperCase() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dueDate === null
          ? { dueDate: null }
          : dto.dueDate
            ? { dueDate: new Date(dto.dueDate) }
            : {}),
      },
      include: {
        owner: true,
        members: true,
      },
    });
  }

  async remove(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member || member.role !== ProjectRole.OWNER) {
      throw new ForbiddenException('Only the project owner can delete the project');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully' };
  }

  async getMembers(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: true,
      },
    });
  }

  async addMember(projectId: string, userId: string, dto: AddMemberDto) {
    const currentMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (
      !currentMember ||
      (currentMember.role !== ProjectRole.OWNER &&
        currentMember.role !== ProjectRole.ADMIN)
    ) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (!targetUser) {
      throw new BadRequestException(
        'No account exists for that email. Send an invitation instead.',
      );
    }

    const alreadyMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: targetUser.id,
      },
    });

    if (alreadyMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: dto.role || ProjectRole.MEMBER,
      },
      include: {
        user: true,
      },
    });
  }

  async leaveProject(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (member.role === ProjectRole.OWNER) {
      throw new ForbiddenException(
        'Project owners must delete the project instead of leaving it',
      );
    }

    await this.prisma.projectMember.delete({
      where: { id: member.id },
    });

    return { message: 'Left project successfully' };
  }
}
