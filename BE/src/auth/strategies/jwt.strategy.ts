import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, JwtFromRequestFunction } from 'passport-jwt';

import { AuthService, User } from '../auth.service';

interface JwtPayload {
  sub: string;
  role?: string;
  email?: string;
  // bạn có thể mở rộng payload nếu cần (iat, exp...)
}

interface JwtValidatedUser extends Omit<User, 'password'> {
  userId: string;
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

    // Return user without password
    const validated: JwtValidatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userId: payload.sub,
    };

    return validated;
  }
}
