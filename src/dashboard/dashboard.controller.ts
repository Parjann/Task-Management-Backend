import { Controller, Get } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Dashboard Summary',
  })
  summary(@CurrentUser() user: any) {
    return this.dashboardService.summary(user.id);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Task Status Analytics',
  })
  status(@CurrentUser() user: any) {
    return this.dashboardService.status(user.id);
  }

  @Get('priority')
  @ApiOperation({
    summary: 'Task Priority Analytics',
  })
  priority(@CurrentUser() user: any) {
    return this.dashboardService.priority(user.id);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Upcoming Tasks',
  })
  upcoming(@CurrentUser() user: any) {
    return this.dashboardService.upcoming(user.id);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Recent Activity',
  })
  activity(@CurrentUser() user: any) {
    return this.dashboardService.activity(user.id);
  }
}
