import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { EMAIL_QUEUE } from '../infrastructure/queues/email/email.constants';
import { PUSH_QUEUE } from '../infrastructure/queues/push/push.constants';
import { NOTIFICATION_QUEUE } from '../infrastructure/queues/notification/notification.constants';
import { ACTIVITY_QUEUE } from '../infrastructure/queues/activity/activity.constants';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      {
        name: EMAIL_QUEUE,
        adapter: BullMQAdapter,
      },
      {
        name: PUSH_QUEUE,
        adapter: BullMQAdapter,
      },
      {
        name: NOTIFICATION_QUEUE,
        adapter: BullMQAdapter,
      },
      {
        name: ACTIVITY_QUEUE,
        adapter: BullMQAdapter,
      },
    ),
  ],
})
export class AppBullBoardModule {}
