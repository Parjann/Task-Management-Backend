import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { LoggingExceptionFilter } from '../common/filters/logging-exception.filter';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: false,
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        genReqId: (req: IncomingMessage) =>
          (req.headers['x-request-id'] as string) || randomUUID(),
        autoLogging: {
          ignore: (req: IncomingMessage) => {
            return req.url?.startsWith('/uploads') || false;
          },
        },
        serializers: {
          req(req: IncomingMessage & { id?: string }) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
            };
          },
          res(res: ServerResponse) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
      },
    }),
  ],
  providers: [LoggingExceptionFilter],
  exports: [LoggerModule, LoggingExceptionFilter],
})
export class AppLoggerModule {}
