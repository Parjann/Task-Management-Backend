import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CommentsService } from './comments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Throttle({
    default: {
      limit: 60,
      ttl: 60000,
    },
  })
  @Post('tasks/:taskId/comments')
  @ApiOperation({
    summary: 'Create Comment',
  })
  create(
    @CurrentUser() user: { id: string },
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, taskId, dto);
  }

  @Get('tasks/:taskId/comments')
  @ApiOperation({
    summary: 'Get Task Comments',
  })
  findAll(
    @CurrentUser() user: { id: string },
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findAll(user.id, taskId);
  }

  @Patch('comments/:id')
  @ApiOperation({
    summary: 'Update Comment',
  })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user.id, id, dto);
  }

  @Delete('comments/:id')
  @ApiOperation({
    summary: 'Delete Comment',
  })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.commentsService.remove(user.id, id);
  }
}
