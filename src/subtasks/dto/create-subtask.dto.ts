import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSubtaskDto {
  @ApiProperty({
    example: 'Design Login Page',
  })
  @IsString()
  title!: string;
}
