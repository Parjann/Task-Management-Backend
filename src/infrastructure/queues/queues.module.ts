import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailQueueModule } from './email/email.module';
import { PushQueueModule } from './push/push.module';
import { NotificationQueueModule } from './notification/notification.module';
import { ActivityQueueModule } from './activity/activity.module';

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
    ActivityQueueModule,
  ],
  exports: [
    BullModule,
    EmailQueueModule,
    PushQueueModule,
    NotificationQueueModule,
    ActivityQueueModule,
  ],
})
export class QueuesModule {}
