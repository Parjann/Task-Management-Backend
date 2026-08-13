import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Change this import if your Prisma client is generated elsewhere
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Remove sensitive fields before sending user to client
   */
  private sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      theme: user.theme,
      accentColor: user.accentColor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: hashedPassword,
      },
    });

    const token = await this.generateToken(user);

    return {
      message: 'User registered successfully',
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Guest account cannot login');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  async guestLogin() {
    const timestamp = Date.now();

    const guest = await this.prisma.user.create({
      data: {
        name: `Guest-${timestamp}`,
        email: `guest-${timestamp}@guest.local`,
        isGuest: true,
      },
    });

    const token = await this.generateToken(guest);

    return {
      message: 'Guest login successful',
      user: this.sanitizeUser(guest),
      accessToken: token,
    };
  }

  async generateToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      isGuest: user.isGuest,
    });
  }
}
