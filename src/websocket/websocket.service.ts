import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(private readonly gateway: WebsocketGateway) {}

  emit(event: string, payload: unknown) {
    if (this.gateway.server) {
      this.gateway.server.emit(event, payload);
    }
  }

  emitToProject(projectId: string, event: string, payload: unknown) {
    if (this.gateway.server) {
      this.gateway.server
        .to(`project:${projectId}`)
        .to(projectId)
        .emit(event, payload);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (this.gateway.server) {
      this.gateway.server.to(`user:${userId}`).emit(event, payload);
    }
  }
}
