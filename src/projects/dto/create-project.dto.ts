import {
  IsDateString,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @Length(3, 50)
  name!: string;

  @IsString()
  @Matches(/^[A-Z]{2,6}$/)
  key!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
