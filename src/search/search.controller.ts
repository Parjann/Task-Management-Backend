import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { SearchService } from './search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from './dto/search.dto';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Global Search',
  })
  search(
    @CurrentUser() user: any,
    @Query() query: SearchDto,
  ) {
    return this.searchService.globalSearch(user.id, query.q);
  }

  @Get('tasks')
  @ApiOperation({
    summary: 'Search Tasks',
  })
  searchTasks(
    @CurrentUser() user: any,
    @Query() query: SearchDto,
  ) {
    return this.searchService.searchTasks(user.id, query.q);
  }

  @Get('projects')
  @ApiOperation({
    summary: 'Search Projects',
  })
  searchProjects(
    @CurrentUser() user: any,
    @Query() query: SearchDto,
  ) {
    return this.searchService.searchProjects(user.id, query.q);
  }

  @Get('users')
  @ApiOperation({
    summary: 'Search Users',
  })
  searchUsers(
    @CurrentUser() user: any,
    @Query() query: SearchDto,
  ) {
    return this.searchService.searchUsers(user.id, query.q);
  }

  @Get('comments')
  @ApiOperation({
    summary: 'Search Comments',
  })
  searchComments(
    @CurrentUser() user: any,
    @Query() query: SearchDto,
  ) {
    return this.searchService.searchComments(user.id, query.q);
  }
}
