import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProjects(userId: string, q?: string) {
    if (!q || !q.trim()) {
      return [];
    }

    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    return this.prisma.project.findMany({
      where: {
        id: {
          in: projectIds,
        },
        OR: [
          {
            name: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
          {
            key: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        color: true,
      },
      take: 20,
    });
  }

  async searchTasks(userId: string, q?: string) {
    if (!q || !q.trim()) {
      return [];
    }

    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    return this.prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        OR: [
          {
            title: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
          },
        },
      },
      take: 20,
    });
  }

  async searchUsers(userId: string, q?: string) {
    if (!q || !q.trim()) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: q.trim(),
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 20,
    });
  }

  async searchComments(userId: string, q?: string) {
    if (!q || !q.trim()) {
      return [];
    }

    const memberProjects = await this.prisma.projectMember.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = memberProjects.map((p) => p.projectId);

    return this.prisma.comment.findMany({
      where: {
        task: {
          projectId: {
            in: projectIds,
          },
        },
        content: {
          contains: q.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        taskId: true,
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      take: 20,
    });
  }

  async globalSearch(userId: string, q?: string) {
    if (!q || !q.trim()) {
      return {
        projects: [],
        tasks: [],
        comments: [],
        users: [],
      };
    }

    const [projects, tasks, comments, users] = await Promise.all([
      this.searchProjects(userId, q),
      this.searchTasks(userId, q),
      this.searchComments(userId, q),
      this.searchUsers(userId, q),
    ]);

    return {
      projects,
      tasks,
      comments,
      users,
    };
  }
}
