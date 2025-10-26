import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, JwtFromRequestFunction } from 'passport-jwt';

import { AuthService } from '../auth.service';
import { User } from 'src/model/users.schema';

interface JwtPayload {
  sub: string;
  role?: string;
  email?: string;
  // bạn có thể mở rộng payload nếu cần (iat, exp...)
}

/**
 * Không extend trực tiếp Omit<User,'password'> để tránh bắt buộc tất cả field.
 * Chỉ khai báo những field cần thiết và để optional cho createdAt/updatedAt.
 */
interface JwtValidatedUser {
  id?: string;
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtFromRequest: JwtFromRequestFunction =
      ExtractJwt.fromAuthHeaderAsBearerToken();
    const secret =
      configService.get<string>('JWT_SECRET') ?? 'super-secret-key';
    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate được gọi khi token hợp lệ về mặt chữ ký và thời hạn.
   * Trả về object sẽ gắn vào req.user. Nếu trả undefined hoặc ném lỗi => Unauthorized.
   */
  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    // Tìm user từ auth service
    const user = await this.authService.findUserById(payload.sub);

    if (!user) {
      // token hợp lệ nhưng user không tồn tại -> không được phép
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Lấy object an toàn (mongoose document -> plain object)
    const u: any =
      typeof (user as any).toObject === 'function'
        ? (user as any).toObject()
        : user;

    // Trả về object đã được sanitized (chỉ trường cần thiết)
    const validated: JwtValidatedUser = {
      id:
        (u._id?.toString && u._id.toString()) ||
        (u.id?.toString && u.id.toString()) ||
        undefined,
      userId: payload.sub,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      address: u.address,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };

    return validated;
  }
}
