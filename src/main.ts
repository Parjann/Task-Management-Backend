import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Logger } from 'nestjs-pino';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { LoggingExceptionFilter } from './common/filters/logging-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  // --------------------------------------------------
  // Static uploads
  // --------------------------------------------------

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // --------------------------------------------------
  // CORS Configuration
  // --------------------------------------------------

  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || '';

  const allowedOrigins = [
    'http://localhost:3000',
    frontendUrl,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      // This is useful for:
      // - Postman
      // - server-to-server requests
      // - health checks
      // - some monitoring services
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log blocked origins for debugging
      logger.warn(`🚫 CORS blocked origin: ${origin}`);

      return callback(
        new Error(`CORS blocked origin: ${origin}`),
        false,
      );
    },

    credentials: true,

    methods: [
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  });

  logger.log(
    `🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`,
  );

  // --------------------------------------------------
  // Global Validation
  // --------------------------------------------------

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // --------------------------------------------------
  // Global Exception Filters
  // --------------------------------------------------

  app.useGlobalFilters(
    app.get(LoggingExceptionFilter),
    new ThrottlerExceptionFilter(),
  );

  // --------------------------------------------------
  // Global API Prefix
  // --------------------------------------------------

  app.setGlobalPrefix('api', {
    exclude: [
      'admin/queues',
      'admin/queues/(.*)',
      'health',
      'health/(.*)',
    ],
  });

  // --------------------------------------------------
  // Swagger
  // --------------------------------------------------

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('Task Management Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, document);

  // --------------------------------------------------
  // Start Server
  // --------------------------------------------------

  const port =
    configService.get<number>('PORT') || 3001;

  await app.listen(port);

  logger.log(
    `🚀 Server running on http://localhost:${port}`,
  );

  logger.log(
    `🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`,
  );

  logger.log(
    `📚 Swagger Docs: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();