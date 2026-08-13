import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationQueueModule } from '../infrastructure/queues/notification/notification.module';
import { DueReminderProcessor } from './due-reminder.processor';
import { OverdueProcessor } from './overdue.processor';
import { CleanupProcessor } from './cleanup.processor';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, NotificationQueueModule],
  providers: [DueReminderProcessor, OverdueProcessor, CleanupProcessor],
})
export class SchedulerModule {}
