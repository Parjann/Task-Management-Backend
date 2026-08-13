import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from './email.constants';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email.service';
import { MailModule } from '../../../mail/mail.module';

@Module({
  imports: [
    MailModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [EmailProcessor, EmailQueueService],
  exports: [EmailQueueService],
})
export class EmailQueueModule {}
