import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchDto {
  @ApiPropertyOptional({
    example: 'login',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
