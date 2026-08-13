import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';
import { NotificationQueueService } from './notification.service';
import { NOTIFICATION_QUEUE } from './notification.constants';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PushQueueModule } from '../push/push.module';
import { WebsocketModule } from '../../../websocket/websocket.module';

@Module({
  imports: [
    PrismaModule,
    PushQueueModule,
    WebsocketModule,
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
  ],
  providers: [NotificationProcessor, NotificationQueueService],
  exports: [NotificationQueueService],
})
export class NotificationQueueModule {}
