// src/auth/auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';                 // <-- thêm
import { UsersService } from '../users/users.service';
import { UserRole } from '../model/users.schema';

type OAuthProfile = {
  provider: 'google';
  providerId: string;
  email: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  accessToken?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /** Đăng ký tài khoản với email/password */
  async register(dto: { name: string; email: string; password: string; role?: UserRole }) {
    const created = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? UserRole.USER,
    });

    const payload = { sub: String(created._id), email: created.email, role: created.role }; // <-- ép string
    const access_token = await this.jwt.signAsync(payload);

    this.usersService.recordLastLogin(String(created._id)).catch(() => void 0);

    return {
      user: {
        id: String(created._id),
        email: created.email,
        name: created.name,
        role: created.role,
      },
      access_token,
    };
  }

  /** Đăng nhập email/password */
  async login(dto: { email: string; password: string }) {
    const userDoc = await this.usersService.findByEmail(dto.email);
    if (!userDoc) {
      throw new BadRequestException('Invalid email or password');
    }

    // user OAuth có thể không có password -> chặn case này
    const hash = userDoc.password;
    if (typeof hash !== 'string' || hash.length === 0) {
      throw new BadRequestException(
        'This account uses Google login. Please sign in with Google or reset your password.',
      );
    }

    const ok = await bcrypt.compare(String(dto.password), hash);   // <-- đảm bảo string
    if (!ok) {
      throw new BadRequestException('Invalid email or password');
    }

    const payload = { sub: String(userDoc._id), email: userDoc.email, role: userDoc.role };
    const access_token = await this.jwt.signAsync(payload);

    this.usersService.recordLastLogin(String(userDoc._id)).catch(() => void 0);

    return {
      user: {
        id: String(userDoc._id),
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role,
      },
      access_token,
    };
  }

  /** Đăng nhập qua Google — khớp với cách controller đang gọi */
  async googleLogin(userFromStrategy: {
    provider?: string;
    providerId?: string;
    email: string | null;
    name?: string | null;
    avatarUrl?: string | null;
    accessToken?: string;
  }) {
    const profile: OAuthProfile = {
      provider: 'google',
      providerId: String(userFromStrategy.providerId ?? ''),
      email: userFromStrategy.email ?? null,
      name: userFromStrategy.name ?? null,
      avatarUrl: userFromStrategy.avatarUrl ?? null,
      accessToken: userFromStrategy.accessToken,
    };
    return this.loginWithOAuthProfile(profile);
  }

  /** Find-or-create user từ Google profile + ký JWT (không phụ thuộc method đặc thù ở UsersService) */
  async loginWithOAuthProfile(p: OAuthProfile) {
    // 1) Ưu tiên tìm theo email (nếu có)
    const normalizedEmail = (p.email ?? `${p.providerId}@${p.provider}.local`).toLowerCase();
    let userDoc = await this.usersService.findByEmail(normalizedEmail);

    // 2) Nếu chưa có -> tạo user mới với mật khẩu ngẫu nhiên (schema hiện tại yêu cầu password)
    if (!userDoc) {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const created = await this.usersService.create({
        name: p.name ?? 'New User',
        email: normalizedEmail,
        password: tempPassword,                  // UsersService.create sẽ hash
        role: UserRole.USER,
      });

      const payload = { sub: String(created._id), email: created.email, role: created.role };
      const access_token = await this.jwt.signAsync(payload);

      this.usersService.recordLastLogin(String(created._id)).catch(() => void 0);

      return {
        user: {
          id: String(created._id),
          email: created.email,
          name: created.name,
          role: created.role,
        },
        access_token,
      };
    }

    // 3) Đã có user -> ký JWT
    const payload = { sub: String(userDoc._id), email: userDoc.email, role: userDoc.role };
    const access_token = await this.jwt.signAsync(payload);

    this.usersService.recordLastLogin(String(userDoc._id)).catch(() => void 0);

    return {
      user: {
        id: String(userDoc._id),
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role,
      },
      access_token,
    };
  }
}
