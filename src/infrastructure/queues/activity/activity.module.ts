import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ACTIVITY_QUEUE } from './activity.constants';
import { ActivityProcessor } from './activity.processor';
import { ActivityQueueService } from './activity.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: ACTIVITY_QUEUE,
    }),
  ],
  providers: [ActivityProcessor, ActivityQueueService],
  exports: [ActivityQueueService],
})
export class ActivityQueueModule {}
