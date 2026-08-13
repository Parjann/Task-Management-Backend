import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar image file is required');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cloudinaryResponse = await this.cloudinaryService.uploadImage(
      file,
      `task-management/users/${userId}/avatar`,
    );

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatarUrl: cloudinaryResponse.secureUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isGuest: true,
        theme: true,
        accentColor: true,
        updatedAt: true,
      },
    });
  }
}
