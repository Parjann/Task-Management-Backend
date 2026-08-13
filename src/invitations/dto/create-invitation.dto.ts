import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    example: 'teammate@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.MEMBER,
  })
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
