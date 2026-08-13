import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.prisma.user.findUnique({
      where: {
        id: user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isGuest: true,
        theme: true,
        accentColor: true,
        createdAt: true,
      },
    });
  }
}
