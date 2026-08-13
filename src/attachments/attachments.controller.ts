import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const uploadDirectory = join(process.cwd(), 'uploads');
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

const multerOptions = {
  storage: diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
};

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Throttle({
    default: {
      limit: 20,
      ttl: 60000,
    },
  })
  @Post('tasks/:taskId/attachments')
  @ApiOperation({
    summary: 'Upload Attachment',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  upload(
    @CurrentUser() user: { id: string },
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(user.id, taskId, file);
  }

  @Get('tasks/:taskId/attachments')
  @ApiOperation({
    summary: 'Get Task Attachments',
  })
  findAll(
    @CurrentUser() user: { id: string },
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.attachmentsService.findAll(user.id, taskId);
  }

  @Delete('attachments/:id')
  @ApiOperation({
    summary: 'Delete Attachment',
  })
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attachmentsService.remove(user.id, id);
  }
}
