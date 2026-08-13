import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueueService } from '../infrastructure/queues/notification/notification.service';

@Injectable()
export class OverdueProcessor {
  private readonly logger = new Logger(OverdueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueTasks() {
    this.logger.log('⏰ Running overdue task checker cron job...');

    const now = new Date();

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          not: TaskStatus.DONE,
        },
        assigneeId: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        projectId: true,
        assigneeId: true,
      },
    });

    this.logger.log(`Found ${overdueTasks.length} overdue task(s)`);

    for (const task of overdueTasks) {
      if (task.assigneeId) {
        await this.notificationQueue.createNotification({
          userId: task.assigneeId,
          title: 'Task Overdue',
          message: `Task "${task.title}" is overdue (${task.dueDate?.toLocaleDateString() || 'past due'}).`,
          taskId: task.id,
          projectId: task.projectId,
          type: NotificationType.DUE_DATE,
        });
      }
    }
  }
}
