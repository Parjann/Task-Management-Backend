import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LabelsService } from './labels.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AssignLabelDto } from './dto/assign-label.dto';

@ApiTags('Labels')
@ApiBearerAuth()
@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  // ===============================
  // Project Labels
  // ===============================

  @Post('projects/:projectId/labels')
  @ApiOperation({
    summary: 'Create Label',
  })
  create(
    @CurrentUser() user: any,
    @Param('projectId', ParseUUIDPipe)
    projectId: string,
    @Body()
    dto: CreateLabelDto,
  ) {
    return this.labelsService.create(user.id, projectId, dto);
  }

  @Get('projects/:projectId/labels')
  @ApiOperation({
    summary: 'Get Project Labels',
  })
  findAll(
    @CurrentUser() user: any,
    @Param('projectId', ParseUUIDPipe)
    projectId: string,
  ) {
    return this.labelsService.findAll(user.id, projectId);
  }

  @Patch('labels/:id')
  @ApiOperation({
    summary: 'Update Label',
  })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe)
    labelId: string,
    @Body()
    dto: UpdateLabelDto,
  ) {
    return this.labelsService.update(user.id, labelId, dto);
  }

  @Delete('labels/:id')
  @ApiOperation({
    summary: 'Delete Label',
  })
  remove(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe)
    labelId: string,
  ) {
    return this.labelsService.remove(user.id, labelId);
  }

  // ===============================
  // Task Labels
  // ===============================

  @Post('tasks/:taskId/labels')
  @ApiOperation({
    summary: 'Assign Label To Task',
  })
  assign(
    @CurrentUser() user: any,
    @Param('taskId', ParseUUIDPipe)
    taskId: string,
    @Body()
    dto: AssignLabelDto,
  ) {
    return this.labelsService.assign(user.id, taskId, dto);
  }

  @Delete('tasks/:taskId/labels/:labelId')
  @ApiOperation({
    summary: 'Remove Label From Task',
  })
  removeLabel(
    @CurrentUser() user: any,
    @Param('taskId', ParseUUIDPipe)
    taskId: string,
    @Param('labelId', ParseUUIDPipe)
    labelId: string,
  ) {
    return this.labelsService.removeLabel(user.id, taskId, labelId);
  }
}
