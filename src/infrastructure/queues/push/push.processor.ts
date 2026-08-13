import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FcmService } from '../../../fcm/fcm.service';
import { PUSH_JOBS, PUSH_QUEUE } from './push.constants';
import {
  PushToProjectPayload,
  PushToUserPayload,
  TaskPushPayload,
} from './push.service';

@Processor(PUSH_QUEUE)
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(private readonly fcmService: FcmService) {
    super();
  }

  async process(job: Job<any>) {
    this.logger.log(`⚙️ Processing push job ${job.id} (${job.name})`);

    switch (job.name) {
      case PUSH_JOBS.SEND_TO_USER: {
        const data = job.data as PushToUserPayload;
        await this.fcmService.sendToUser(
          data.userId,
          data.title,
          data.body,
          data.data,
        );
        break;
      }

      case PUSH_JOBS.SEND_TO_PROJECT: {
        const data = job.data as PushToProjectPayload;
        await this.fcmService.sendToProject(
          data.projectId,
          data.title,
          data.body,
          data.data,
        );
        break;
      }

      case PUSH_JOBS.TASK_ASSIGNED:
      case PUSH_JOBS.TASK_UPDATED:
      case PUSH_JOBS.COMMENT_ADDED: {
        const data = job.data as TaskPushPayload;
        await this.fcmService.sendToUser(data.userId, data.title, data.body, {
          taskId: data.taskId,
          projectId: data.projectId,
        });
        break;
      }

      default:
        this.logger.warn(`⚠️ Unknown push job name: ${job.name}`);
    }

    this.logger.log(`✅ Completed push job ${job.id} (${job.name})`);
  }
}
