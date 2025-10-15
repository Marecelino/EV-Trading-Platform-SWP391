// src/auth/auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Simple in-memory storage for demo purposes
// In production, you would use a proper database
const users = new Map();

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /** Đăng ký tài khoản với email/password */
  async register(dto: { name: string; email: string; password: string; role?: string }) {
    // Check if user already exists
    const existingUser = Array.from(users.values()).find((user: User) => user.email === dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: dto.role ?? 'user',
    };

    users.set(userId, newUser);

    const payload = { sub: userId, email: newUser.email, role: newUser.role };
    const access_token = await this.jwt.signAsync(payload);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      access_token,
    };
  }

  /** Đăng nhập email/password */
  async login(dto: { email: string; password: string }) {
    const user = Array.from(users.values()).find((user: User) => user.email === dto.email);
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwt.signAsync(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token,
    };
  }

  /** Find user by ID for JWT strategy */
  async findUserById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }

  /** Find user by email */
  async findUserByEmail(email: string): Promise<User | null> {
    return Array.from(users.values()).find((user: User) => user.email === email) || null;
  }
}
