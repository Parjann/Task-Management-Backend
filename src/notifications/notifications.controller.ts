import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get My Notifications',
  })
  findAll(@CurrentUser() user: any) {
    return this.notificationsService.findAll(user.id);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Unread Count',
  })
  unreadCount(@CurrentUser() user: any) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark Notification Read',
  })
  read(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.read(user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark All Read',
  })
  readAll(@CurrentUser() user: any) {
    return this.notificationsService.readAll(user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Notification',
  })
  remove(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
