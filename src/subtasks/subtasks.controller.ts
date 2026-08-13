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

import { SubtasksService } from './subtasks.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@ApiTags('Subtasks')
@ApiBearerAuth()
@Controller()
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post('tasks/:taskId/subtasks')
  @ApiOperation({
    summary: 'Create Subtask',
  })
  create(
    @CurrentUser() user: any,
    @Param('taskId') taskId: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.subtasksService.create(user.id, taskId, dto);
  }

  @Get('tasks/:taskId/subtasks')
  @ApiOperation({
    summary: 'Get Task Subtasks',
  })
  findAll(@CurrentUser() user: any, @Param('taskId') taskId: string) {
    return this.subtasksService.findAll(user.id, taskId);
  }

  @Patch('subtasks/:id')
  @ApiOperation({
    summary: 'Update Subtask',
  })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.subtasksService.update(user.id, id, dto);
  }

  @Delete('subtasks/:id')
  @ApiOperation({
    summary: 'Delete Subtask',
  })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subtasksService.remove(user.id, id);
  }
}
