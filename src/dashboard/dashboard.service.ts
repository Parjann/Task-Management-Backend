import { Injectable } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      projects,
      tasks,
      completed,
      todo,
      inProgress,
      inReview,
      overdue,
      dueToday,
      myTasks,
    ] = await Promise.all([
      this.prisma.project.count({
        where: {
          id: {
            in: projectIds,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
          status: TaskStatus.DONE,
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
          status: TaskStatus.TODO,
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
          status: TaskStatus.IN_PROGRESS,
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
          status: TaskStatus.IN_REVIEW,
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
          dueDate: {
            lt: today,
          },
          status: {
            not: TaskStatus.DONE,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          projectId: {
            in: projectIds,
          },
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          assigneeId: userId,
        },
      }),
    ]);

    return {
      projects,
      tasks,
      completed,
      todo,
      inProgress,
      inReview,
      overdue,
      dueToday,
      myTasks,
    };
  }

  async status(userId: string) {
    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    const counts = await this.prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: {
          in: projectIds,
        },
      },
      _count: {
        _all: true,
      },
    });

    return counts.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));
  }

  async priority(userId: string) {
    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    const counts = await this.prisma.task.groupBy({
      by: ['priority'],
      where: {
        projectId: {
          in: projectIds,
        },
      },
      _count: {
        _all: true,
      },
    });

    return counts.map((item) => ({
      priority: item.priority,
      count: item._count._all,
    }));
  }

  async upcoming(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: {
          gte: today,
        },
        status: {
          not: TaskStatus.DONE,
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
          },
        },
      },
    });
  }

  async activity(userId: string) {
    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    return this.prisma.activity.findMany({
      where: {
        task: {
          projectId: {
            in: projectIds,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }
}
