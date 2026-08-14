import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryHealthIndicator extends HealthIndicator {
  async isHealthy(key = 'cloudinary'): Promise<HealthIndicatorResult> {
    try {
      const pingResult = (await cloudinary.api.ping()) as {
        status?: string;
      };
      const isHealthy = Boolean(pingResult && pingResult.status === 'ok');

      const result = this.getStatus(key, isHealthy, {
        status: isHealthy ? 'up' : 'down',
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Cloudinary check failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Cloudinary check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: (error as Error).message,
        }),
      );
    }
  }
}
