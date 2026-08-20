import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
        title: true,
        username: true,
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
        title: true,
        username: true,
        isGuest: true,
        theme: true,
        accentColor: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailTaken) {
        throw new ConflictException('Email is already in use');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.email !== undefined
            ? { email: dto.email.toLowerCase() }
            : {}),
          ...(dto.title !== undefined ? { title: dto.title || null } : {}),
          ...(dto.username !== undefined
            ? { username: dto.username || null }
            : {}),
          ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
          ...(dto.accentColor !== undefined
            ? { accentColor: dto.accentColor }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          title: true,
          username: true,
          isGuest: true,
          theme: true,
          accentColor: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }
      throw error;
    }
  }

  async leaveWorkspace(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
    });

    const ownedProjectIds = memberships
      .filter((m) => m.role === ProjectRole.OWNER)
      .map((m) => m.projectId);
    const memberIds = memberships
      .filter((m) => m.role !== ProjectRole.OWNER)
      .map((m) => m.id);

    await this.prisma.$transaction(async (tx) => {
      if (ownedProjectIds.length > 0) {
        await tx.project.deleteMany({
          where: { id: { in: ownedProjectIds } },
        });
      }

      if (memberIds.length > 0) {
        await tx.projectMember.deleteMany({
          where: { id: { in: memberIds } },
        });
      }
    });

    return { message: 'Left workspace successfully' };
  }
}
