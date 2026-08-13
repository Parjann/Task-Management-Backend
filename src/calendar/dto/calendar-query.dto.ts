import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CalendarQueryDto {
  @ApiPropertyOptional({
    example: 2026,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    example: 8,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(12)
  month?: number;
}
