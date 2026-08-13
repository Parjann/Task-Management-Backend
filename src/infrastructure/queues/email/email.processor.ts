import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../../../mail/mail.service';
import { EMAIL_QUEUE, SEND_INVITATION_JOB } from './email.constants';
import { SendInvitationEmailPayload } from './email.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<SendInvitationEmailPayload>) {
    this.logger.log(`⚙️ Processing email job ${job.id} (${job.name})`);
    switch (job.name) {
      case SEND_INVITATION_JOB:
        await this.mailService.sendProjectInvitation(job.data);
        this.logger.log(
          `✅ Completed invitation email job ${job.id} for ${job.data.to}`,
        );
        break;
      default:
        this.logger.warn(`⚠️ Unknown job name: ${job.name}`);
    }
  }
}
