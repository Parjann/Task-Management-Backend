import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ActivityAction } from '@prisma/client';
import { ACTIVITY_QUEUE, ActivityJobs } from './activity.constants';

export interface CreateActivityPayload {
  taskId: string;
  userId: string;
  action: ActivityAction;
  message: string;
}

@Injectable()
export class ActivityQueueService {
  private readonly logger = new Logger(ActivityQueueService.name);

  constructor(
    @InjectQueue(ACTIVITY_QUEUE)
    private readonly queue: Queue,
  ) {}

  async createActivity(data: CreateActivityPayload) {
    this.logger.log(`📥 Enqueueing activity job: "${data.message}"`);
    await this.queue.add(ActivityJobs.CREATE, data, {
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
