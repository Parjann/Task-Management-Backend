import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailQueueModule } from './email/email.module';
import { PushQueueModule } from './push/push.module';
import { NotificationQueueModule } from './notification/notification.module';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    EmailQueueModule,
    PushQueueModule,
    NotificationQueueModule,
  ],
  exports: [
    BullModule,
    EmailQueueModule,
    PushQueueModule,
    NotificationQueueModule,
  ],
})
export class QueuesModule {}
