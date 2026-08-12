import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CreateSubtaskDto } from './create-subtask.dto';

export class UpdateSubtaskDto extends PartialType(CreateSubtaskDto) {
  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
