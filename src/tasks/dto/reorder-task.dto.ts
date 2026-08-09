import {
  IsEnum,
  IsNumber,
  IsUUID,
} from 'class-validator';

import { TaskStatus } from '@prisma/client';

export class ReorderTaskDto {
  @IsUUID()
  taskId!: string;

  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsNumber()
  orderIndex!: number;
}