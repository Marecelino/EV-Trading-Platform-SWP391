import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, JwtFromRequestFunction } from 'passport-jwt';
import { UsersService, SanitizedUser } from '../../users/users.service';
import { UserRole } from '../../model/users.schema';

interface JwtPayload {
  sub: string;
  role?: UserRole;
  // bạn có thể mở rộng payload nếu cần (email, iat, exp...)
}

interface JwtValidatedUser extends SanitizedUser {
  userId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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
    // Tìm user từ DB (trả về sanitized user)
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      // token hợp lệ nhưng user không tồn tại -> không được phép
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // Nếu bạn có trường status (active/inactive/banned), kiểm tra ở đây
    // if (user.status && user.status !== 'active') {
    //   throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    // }

    // Map _id -> userId cho rõ ràng (vẫn giữ các trường trong sanitized user)
    const validated: JwtValidatedUser = {
      ...user,
      userId: payload.sub,
    };

    return validated;
  }
}
