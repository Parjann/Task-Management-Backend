import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACTIVITY_QUEUE, ActivityJobs } from './activity.constants';
import { CreateActivityPayload } from './activity.service';

@Processor(ACTIVITY_QUEUE)
export class ActivityProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CreateActivityPayload>) {
    this.logger.log(`⚙️ Processing activity job ${job.id} (${job.name})`);

    switch (job.name) {
      case ActivityJobs.CREATE: {
        await this.prisma.activity.create({
          data: {
            taskId: job.data.taskId,
            userId: job.data.userId,
            action: job.data.action,
            message: job.data.message,
          },
        });
        break;
      }
      default:
        this.logger.warn(`⚠️ Unknown activity job name: ${job.name}`);
    }

    this.logger.log(`✅ Completed activity job ${job.id}`);
  }
}
