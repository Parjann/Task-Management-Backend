import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { Type } from 'class-transformer';

import { TaskPriority, TaskStatus } from '@prisma/client';

export class GetTasksDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 50;

  @IsOptional()
  @IsString()
  sortBy = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder: 'asc' | 'desc' = 'desc';
}
