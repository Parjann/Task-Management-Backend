import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterTokenDto {
  @ApiProperty({
    example: 'fcm_device_registration_token_here',
    description:
      'Firebase Cloud Messaging registration token from client device',
  })
  @IsNotEmpty()
  @IsString()
  token!: string;
}
