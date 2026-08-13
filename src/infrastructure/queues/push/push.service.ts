import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PUSH_JOBS, PUSH_QUEUE } from './push.constants';

export interface PushToUserPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushToProjectPayload {
  projectId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface TaskPushPayload {
  userId: string;
  title: string;
  body: string;
  taskId: string;
  projectId: string;
}

@Injectable()
export class PushQueueService {
  private readonly logger = new Logger(PushQueueService.name);

  constructor(
    @InjectQueue(PUSH_QUEUE)
    private readonly queue: Queue,
  ) {}

  async sendPushToUser(data: PushToUserPayload) {
    this.logger.log(`📥 Enqueueing push notification for user ${data.userId}`);
    await this.queue.add(PUSH_JOBS.SEND_TO_USER, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async sendPushToProject(data: PushToProjectPayload) {
    this.logger.log(
      `📥 Enqueueing push notification for project ${data.projectId}`,
    );
    await this.queue.add(PUSH_JOBS.SEND_TO_PROJECT, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async sendTaskAssigned(data: TaskPushPayload) {
    this.logger.log(`📥 Enqueueing task assigned push for user ${data.userId}`);
    await this.queue.add(PUSH_JOBS.TASK_ASSIGNED, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async sendTaskUpdated(data: TaskPushPayload) {
    this.logger.log(`📥 Enqueueing task updated push for user ${data.userId}`);
    await this.queue.add(PUSH_JOBS.TASK_UPDATED, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async sendCommentNotification(data: TaskPushPayload) {
    this.logger.log(`📥 Enqueueing comment push for user ${data.userId}`);
    await this.queue.add(PUSH_JOBS.COMMENT_ADDED, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
