import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.logger.log('🟢 Redis Connected successfully');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`🔴 Redis Connection Error: ${err.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🛑 Redis Connection Closed');
  }
}
