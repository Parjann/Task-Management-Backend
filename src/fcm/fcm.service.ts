import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async registerToken(userId: string, token: string) {
    await this.prisma.fcmToken.upsert({
      where: {
        token,
      },
      create: {
        userId,
        token,
      },
      update: {
        userId,
      },
    });

    this.logger.log(`📱 FCM token registered for user: ${userId}`);

    return {
      success: true,
      message: 'FCM token registered successfully',
    };
  }

  async removeToken(userId: string, token: string) {
    await this.prisma.fcmToken.deleteMany({
      where: {
        token,
        userId,
      },
    });

    this.logger.log(`📱 FCM token removed for user: ${userId}`);

    return {
      success: true,
      message: 'FCM token removed successfully',
    };
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const fcmTokens = await this.prisma.fcmToken.findMany({
      where: {
        userId,
      },
      select: {
        token: true,
      },
    });

    if (fcmTokens.length === 0) {
      return {
        sent: 0,
        message: 'No registered device tokens for this user',
      };
    }

    const tokens = fcmTokens.map((t) => t.token);

    if (!this.firebaseService.messaging) {
      this.logger.log(
        `📱 [DEV MOCK FCM] To user: ${userId} | Title: "${title}" | Body: "${body}" | Tokens count: ${tokens.length}`,
      );
      return {
        sent: tokens.length,
        mock: true,
      };
    }

    try {
      const response =
        await this.firebaseService.messaging.sendEachForMulticast({
          tokens,
          notification: {
            title,
            body,
          },
          data,
        });

      // Clean up invalid or expired registration tokens
      const tokensToRemove: string[] = [];
      response.responses.forEach((res, idx) => {
        if (!res.success && res.error) {
          const code = res.error.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await this.prisma.fcmToken.deleteMany({
          where: {
            token: {
              in: tokensToRemove,
            },
          },
        });
        this.logger.log(
          `🧹 Cleaned up ${tokensToRemove.length} stale FCM token(s)`,
        );
      }

      this.logger.log(
        `📱 FCM multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );

      return {
        sent: response.successCount,
        failed: response.failureCount,
      };
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'FCM send error';
      this.logger.error(`❌ Failed to send FCM notification: ${errMessage}`);
      return {
        sent: 0,
        error: errMessage,
      };
    }
  }

  async sendToProject(
    projectId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId,
      },
      select: {
        userId: true,
      },
    });

    const userIds = members.map((m) => m.userId);

    const fcmTokens = await this.prisma.fcmToken.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      select: {
        token: true,
      },
    });

    if (fcmTokens.length === 0) {
      return {
        sent: 0,
      };
    }

    const tokens = fcmTokens.map((t) => t.token);

    if (!this.firebaseService.messaging) {
      this.logger.log(
        `📱 [DEV MOCK FCM] To project: ${projectId} | Title: "${title}" | Body: "${body}" | Tokens: ${tokens.length}`,
      );
      return {
        sent: tokens.length,
        mock: true,
      };
    }

    try {
      const response =
        await this.firebaseService.messaging.sendEachForMulticast({
          tokens,
          notification: {
            title,
            body,
          },
          data,
        });

      return {
        sent: response.successCount,
        failed: response.failureCount,
      };
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'FCM send error';
      this.logger.error(
        `❌ Failed to send project FCM notifications: ${errMessage}`,
      );
      return {
        sent: 0,
        error: errMessage,
      };
    }
  }

  async sendTest(userId: string) {
    return this.sendToUser(
      userId,
      'TaskFlow Test Notification',
      'This is a test push notification from TaskFlow backend.',
      {
        type: 'TEST',
        timestamp: new Date().toISOString(),
      },
    );
  }
}
