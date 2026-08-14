import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { FcmModule } from '../fcm/fcm.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RedisHealthIndicator } from './indicators/redis.health';
import { FirebaseHealthIndicator } from './indicators/firebase.health';
import { CloudinaryHealthIndicator } from './indicators/cloudinary.health';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    RedisModule,
    CloudinaryModule,
    FcmModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    RedisHealthIndicator,
    FirebaseHealthIndicator,
    CloudinaryHealthIndicator,
  ],
  exports: [HealthService],
})
export class HealthModule {}
