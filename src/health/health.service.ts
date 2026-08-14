import { Injectable } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './indicators/redis.health';
import { FirebaseHealthIndicator } from './indicators/firebase.health';
import { CloudinaryHealthIndicator } from './indicators/cloudinary.health';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly firebaseHealth: FirebaseHealthIndicator,
    private readonly cloudinaryHealth: CloudinaryHealthIndicator,
  ) {}

  async check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
      () => this.firebaseHealth.isHealthy('firebase'),
      () => this.cloudinaryHealth.isHealthy('cloudinary'),
    ]);
  }

  async database() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  async redis() {
    return this.health.check([() => this.redisHealth.isHealthy('redis')]);
  }

  async firebase() {
    return this.health.check([() => this.firebaseHealth.isHealthy('firebase')]);
  }

  async cloudinary() {
    return this.health.check([
      () => this.cloudinaryHealth.isHealthy('cloudinary'),
    ]);
  }
}
