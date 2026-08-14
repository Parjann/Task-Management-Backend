import { Injectable, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const existingProject = await this.prisma.project.findUnique({
      where: {
        key: dto.key,
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
        members: true,
      },
    });

    return {
      message: 'Project created successfully',
      project,
    };
  }

  async findAll(_userId: string) {}

  async findOne(_projectId: string, _userId: string) {}

  async update(_projectId: string, _userId: string, _dto: UpdateProjectDto) {}

  async remove(_projectId: string, _userId: string) {}

  async getMembers(_projectId: string, _userId: string) {}

  async addMember(_projectId: string, _userId: string, _dto: AddMemberDto) {}
}
