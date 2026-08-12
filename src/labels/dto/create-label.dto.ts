import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({
    example: 'Bug',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name!: string;

  @ApiProperty({
    example: '#EF4444',
  })
  @IsString()
  @IsNotEmpty()
  @IsHexColor()
  color!: string;
}
