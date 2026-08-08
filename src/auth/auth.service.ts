import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
      user,
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
      user,
      accessToken: token,
    };
  }

  async guestLogin() {
    const guest = await this.prisma.user.create({
      data: {
        name: `Guest-${Date.now()}`,
        email: `guest-${Date.now()}@guest.local`,
        isGuest: true,
      },
    });

    const token = await this.generateToken(guest);

    return {
      message: 'Guest login successful',
      user: guest,
      accessToken: token,
    };
  }

  async generateToken(user: any) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      isGuest: user.isGuest,
    });
  }
}