import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { getApps } from 'firebase-admin/app';

@Injectable()
export class FirebaseHealthIndicator extends HealthIndicator {
  isHealthy(key = 'firebase'): Promise<HealthIndicatorResult> {
    try {
      const apps = getApps();
      const isHealthy = apps.length > 0;

      const result = this.getStatus(key, isHealthy, {
        status: isHealthy ? 'up' : 'down',
        appName: isHealthy ? apps[0].name : undefined,
      });

      if (isHealthy) {
        return Promise.resolve(result);
      }
      return Promise.reject(
        new HealthCheckError('Firebase check failed', result),
      );
    } catch (error) {
      return Promise.reject(
        new HealthCheckError(
          'Firebase check failed',
          this.getStatus(key, false, {
            status: 'down',
            error: (error as Error).message,
          }),
        ),
      );
    }
  }
}
