import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly taskSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    orderIndex: true,
    projectId: true,
    assigneeId: true,
    creatorId: true,
    project: {
      select: {
        id: true,
        name: true,
        key: true,
        color: true,
      },
    },
    assignee: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
  };

  private async getUserProjectIds(userId: string): Promise<string[]> {
    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    return memberProjects.map((p) => p.projectId);
  }

  async today(userId: string) {
    const projectIds = await this.getUserProjectIds(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    return this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        dueDate: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      select: this.taskSelect,
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async upcoming(userId: string) {
    const projectIds = await this.getUserProjectIds(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        dueDate: {
          gte: startOfToday,
        },
        status: {
          not: TaskStatus.DONE,
        },
      },
      select: this.taskSelect,
      orderBy: {
        dueDate: 'asc',
      },
      take: 50,
    });
  }

  async overdue(userId: string) {
    const projectIds = await this.getUserProjectIds(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        dueDate: {
          lt: startOfToday,
        },
        status: {
          not: TaskStatus.DONE,
        },
      },
      select: this.taskSelect,
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async week(userId: string) {
    const projectIds = await this.getUserProjectIds(userId);

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        dueDate: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      select: this.taskSelect,
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async month(userId: string, query: CalendarQueryDto) {
    const projectIds = await this.getUserProjectIds(userId);

    const now = new Date();
    const year = query.year ?? now.getFullYear();
    const month = query.month ?? now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        dueDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      select: this.taskSelect,
      orderBy: {
        dueDate: 'asc',
      },
    });

    return {
      year,
      month,
      total: tasks.length,
      tasks,
    };
  }
}
