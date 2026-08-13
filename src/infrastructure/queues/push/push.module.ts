import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PUSH_QUEUE } from './push.constants';
import { PushProcessor } from './push.processor';
import { PushQueueService } from './push.service';
import { FcmModule } from '../../../fcm/fcm.module';

@Module({
  imports: [
    FcmModule,
    BullModule.registerQueue({
      name: PUSH_QUEUE,
    }),
  ],
  providers: [PushProcessor, PushQueueService],
  exports: [PushQueueService],
})
export class PushQueueModule {}
