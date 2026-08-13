import { Controller, Get, Query } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('today')
  @ApiOperation({
    summary: 'Today Tasks',
  })
  today(@CurrentUser() user: { id: string }) {
    return this.calendarService.today(user.id);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Upcoming Tasks',
  })
  upcoming(@CurrentUser() user: { id: string }) {
    return this.calendarService.upcoming(user.id);
  }

  @Get('overdue')
  @ApiOperation({
    summary: 'Overdue Tasks',
  })
  overdue(@CurrentUser() user: { id: string }) {
    return this.calendarService.overdue(user.id);
  }

  @Get('week')
  @ApiOperation({
    summary: 'Weekly Calendar',
  })
  week(@CurrentUser() user: { id: string }) {
    return this.calendarService.week(user.id);
  }

  @Get('month')
  @ApiOperation({
    summary: 'Monthly Calendar',
  })
  month(@CurrentUser() user: { id: string }, @Query() query: CalendarQueryDto) {
    return this.calendarService.month(user.id, query);
  }
}
