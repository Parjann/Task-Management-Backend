import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Started working on authentication.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
