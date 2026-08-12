import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ProjectRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { getProjectMember } from '../common/utils/get-project-member';
import { checkProjectPermission } from '../common/utils/project-permission';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AssignLabelDto } from './dto/assign-label.dto';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    projectId: string,
    dto: CreateLabelDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await getProjectMember(
      this.prisma,
      projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    const existingLabel = await this.prisma.label.findUnique({
      where: {
        projectId_name: {
          projectId,
          name: dto.name,
        },
      },
    });

    if (existingLabel) {
      throw new BadRequestException(
        'A label with this name already exists in this project.',
      );
    }

    return this.prisma.label.create({
      data: {
        name: dto.name,
        color: dto.color,
        projectId,
      },
    });
  }

  async findAll(
    userId: string,
    projectId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await getProjectMember(
      this.prisma,
      projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ]);

    return this.prisma.label.findMany({
      where: {
        projectId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(
    userId: string,
    labelId: string,
    dto: UpdateLabelDto,
  ) {
    const label = await this.prisma.label.findUnique({
      where: {
        id: labelId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    const member = await getProjectMember(
      this.prisma,
      label.projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    if (dto.name && dto.name !== label.name) {
      const existingLabel = await this.prisma.label.findUnique({
        where: {
          projectId_name: {
            projectId: label.projectId,
            name: dto.name,
          },
        },
      });

      if (existingLabel) {
        throw new BadRequestException(
          'A label with this name already exists in this project.',
        );
      }
    }

    return this.prisma.label.update({
      where: {
        id: labelId,
      },
      data: dto,
    });
  }

  async remove(
    userId: string,
    labelId: string,
  ) {
    const label = await this.prisma.label.findUnique({
      where: {
        id: labelId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    const member = await getProjectMember(
      this.prisma,
      label.projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    await this.prisma.label.delete({
      where: {
        id: labelId,
      },
    });

    return {
      message: 'Label deleted successfully',
    };
  }

  async assign(
    userId: string,
    taskId: string,
    dto: AssignLabelDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(
      this.prisma,
      task.projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    const label = await this.prisma.label.findUnique({
      where: {
        id: dto.labelId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    if (label.projectId !== task.projectId) {
      throw new BadRequestException(
        'Label does not belong to the same project as the task.',
      );
    }

    const existingAssignment = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId: dto.labelId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Label is already assigned to this task.',
      );
    }

    return this.prisma.taskLabel.create({
      data: {
        taskId,
        labelId: dto.labelId,
      },
      include: {
        label: true,
      },
    });
  }

  async removeLabel(
    userId: string,
    taskId: string,
    labelId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = await getProjectMember(
      this.prisma,
      task.projectId,
      userId,
    );

    checkProjectPermission(member.role, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    const taskLabel = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (!taskLabel) {
      throw new NotFoundException(
        'Label is not assigned to this task.',
      );
    }

    await this.prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    return {
      message: 'Label removed from task successfully',
    };
  }
}
