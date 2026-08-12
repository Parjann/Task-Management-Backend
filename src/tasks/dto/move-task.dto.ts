import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class MoveTaskDto {
  @ApiProperty({
    enum: TaskStatus,
  })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @ApiProperty({
    example: 3,
  })
  @IsNumber()
  orderIndex!: number;
}
