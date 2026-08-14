import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Comprehensive system health check',
  })
  check() {
    return this.healthService.check();
  }

  @Public()
  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe (process up)',
  })
  live() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe (dependencies available)',
  })
  ready() {
    return this.healthService.check();
  }

  @Public()
  @Get('database')
  @HealthCheck()
  @ApiOperation({
    summary: 'PostgreSQL database health check',
  })
  database() {
    return this.healthService.database();
  }

  @Public()
  @Get('redis')
  @HealthCheck()
  @ApiOperation({
    summary: 'Redis cache & queues health check',
  })
  redis() {
    return this.healthService.redis();
  }

  @Public()
  @Get('storage')
  @HealthCheck()
  @ApiOperation({
    summary: 'Cloudinary CDN health check',
  })
  storage() {
    return this.healthService.cloudinary();
  }

  @Public()
  @Get('firebase')
  @HealthCheck()
  @ApiOperation({
    summary: 'Firebase Admin FCM health check',
  })
  firebase() {
    return this.healthService.firebase();
  }
}
