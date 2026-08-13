import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueueService } from '../infrastructure/queues/notification/notification.service';

@Injectable()
export class DueReminderProcessor {
  private readonly logger = new Logger(DueReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDueReminders() {
    this.logger.log('⏰ Running due reminder cron job...');

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: next24Hours,
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

    this.logger.log(`Found ${tasks.length} task(s) due within next 24 hours`);

    for (const task of tasks) {
      if (task.assigneeId) {
        await this.notificationQueue.createNotification({
          userId: task.assigneeId,
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due soon (${task.dueDate?.toLocaleDateString() || 'upcoming'}).`,
          taskId: task.id,
          projectId: task.projectId,
          type: NotificationType.DUE_DATE,
        });
      }
    }
  }
}
