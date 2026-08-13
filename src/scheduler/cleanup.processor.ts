import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    this.logger.log('🧹 Running daily cleanup cron job...');
    const now = new Date();

    // 1. Mark expired pending invitations
    const expiredInvites = await this.prisma.invitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: InvitationStatus.EXPIRED,
      },
    });
    this.logger.log(`Marked ${expiredInvites.count} invitation(s) as EXPIRED`);

    // 2. Delete read notifications older than 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const deletedNotifications = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });
    this.logger.log(
      `Deleted ${deletedNotifications.count} old read notification(s)`,
    );

    // 3. Delete temporary guest accounts older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deletedGuests = await this.prisma.user.deleteMany({
      where: {
        isGuest: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    this.logger.log(
      `Cleaned up ${deletedGuests.count} expired guest account(s)`,
    );
  }
}
