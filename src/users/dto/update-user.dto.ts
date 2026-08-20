import { ApiPropertyOptional } from '@nestjs/swagger';
import { Theme } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alex Rivera' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @ApiPropertyOptional({ example: 'alex@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Product Designer' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  title?: string;

  @ApiPropertyOptional({ example: 'alex' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{2,30}$/, {
    message:
      'Username must be 2-30 characters and use letters, numbers, dots, underscores, or hyphens',
  })
  username?: string;

  @ApiPropertyOptional({ enum: Theme })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ example: '#6366F1' })
  @IsOptional()
  @IsHexColor()
  accentColor?: string;
}
