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

  async findAll(_userId: string) {
    return this.prisma.project.findMany({
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
      data: dto,
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

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role || ProjectRole.MEMBER,
      },
      include: {
        user: true,
      },
    });
  }
}
