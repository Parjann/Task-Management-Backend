import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email?: string;
}

interface SocketData {
  userId?: string;
  user?: unknown;
}

type AppSocket = Socket<any, any, any, SocketData>;

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AppSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(
          `❌ Socket ${client.id} connection rejected: No token provided`,
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user) {
        this.logger.warn(
          `❌ Socket ${client.id} connection rejected: User not found`,
        );
        client.disconnect();
        return;
      }

      client.data = {
        user,
        userId: user.id,
      };

      // Join user-specific private room for targeted notifications
      await client.join(`user:${user.id}`);

      this.logger.log(
        `✅ Socket Connected: ${client.id} (User: ${user.name || user.email})`,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid token';
      this.logger.warn(
        `❌ Socket ${client.id} connection rejected: ${errorMessage}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AppSocket) {
    this.logger.log(`❌ Socket Disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AppSocket) {
    client.emit('pong', {
      message: 'pong',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join-project')
  @SubscribeMessage('project.join')
  async handleJoinProject(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() data: string | { projectId: string },
  ) {
    const userId = client.data?.userId;
    const projectId = typeof data === 'string' ? data : data?.projectId;

    if (!userId || !projectId) {
      return {
        success: false,
        message: 'Invalid project ID',
      };
    }

    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      return {
        success: false,
        message: 'You are not a member of this project',
      };
    }

    await client.join(`project:${projectId}`);
    await client.join(projectId);

    this.logger.log(`👥 User ${userId} joined project room: ${projectId}`);

    return {
      success: true,
      projectId,
      message: `Joined project room ${projectId}`,
    };
  }

  @SubscribeMessage('leave-project')
  @SubscribeMessage('project.leave')
  async handleLeaveProject(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() data: string | { projectId: string },
  ) {
    const projectId = typeof data === 'string' ? data : data?.projectId;

    if (projectId) {
      await client.leave(`project:${projectId}`);
      await client.leave(projectId);
      return {
        success: true,
        projectId,
        message: `Left project room ${projectId}`,
      };
    }

    return {
      success: false,
    };
  }

  private extractToken(client: AppSocket): string | null {
    const handshakeAuth = client.handshake.auth as
      Record<string, unknown> | undefined;
    const handshakeHeaders = client.handshake.headers as
      Record<string, unknown> | undefined;
    const handshakeQuery = client.handshake.query as
      Record<string, unknown> | undefined;

    const rawAuth =
      handshakeAuth?.token ??
      handshakeHeaders?.authorization ??
      handshakeQuery?.token;

    if (typeof rawAuth === 'string') {
      if (rawAuth.startsWith('Bearer ')) {
        return rawAuth.substring(7);
      }
      return rawAuth;
    }

    return null;
  }
}
