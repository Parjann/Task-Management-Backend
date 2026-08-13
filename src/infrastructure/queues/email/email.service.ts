import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE, SEND_INVITATION_JOB } from './email.constants';

export interface SendInvitationEmailPayload {
  to: string;
  inviterName: string;
  projectName: string;
  role: string;
  inviteUrl: string;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly queue: Queue,
  ) {}

  async sendInvitationEmail(data: SendInvitationEmailPayload) {
    this.logger.log(`📥 Enqueueing invitation email job for ${data.to}`);
    await this.queue.add(SEND_INVITATION_JOB, data, {
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
