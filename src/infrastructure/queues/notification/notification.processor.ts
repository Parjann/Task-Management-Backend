import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PushQueueService } from '../push/push.service';
import { WebsocketService } from '../../../websocket/websocket.service';
import { NOTIFICATION_QUEUE, NotificationJobs } from './notification.constants';
import { CreateNotificationPayload } from './notification.service';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushQueue: PushQueueService,
    private readonly websocketService: WebsocketService,
  ) {
    super();
  }

  async process(job: Job<CreateNotificationPayload>) {
    this.logger.log(`⚙️ Processing notification job ${job.id} (${job.name})`);

    switch (job.name) {
      case NotificationJobs.CREATE: {
        const notification = await this.prisma.notification.create({
          data: {
            userId: job.data.userId,
            title: job.data.title,
            message: job.data.message,
            type: job.data.type,
            taskId: job.data.taskId,
            projectId: job.data.projectId,
          },
        });

        // Instant WebSocket emission to online user
        this.websocketService.emitToUser(
          job.data.userId,
          'notification.created',
          notification,
        );

        // Queue asynchronous push notification to device tokens
        await this.pushQueue.sendPushToUser({
          userId: job.data.userId,
          title: job.data.title,
          body: job.data.message,
          data: {
            notificationId: notification.id,
            type: job.data.type,
            taskId: job.data.taskId || '',
            projectId: job.data.projectId || '',
          },
        });

        break;
      }
      default:
        this.logger.warn(`⚠️ Unknown notification job name: ${job.name}`);
    }

    this.logger.log(`✅ Completed notification job ${job.id}`);
  }
}
