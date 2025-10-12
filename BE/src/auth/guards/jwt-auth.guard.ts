import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Ghi đè phương thức handleRequest để tùy chỉnh phản hồi khi xác thực JWT.
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Nếu có lỗi hoặc không có user được xác thực
    if (err || !user) {
      let message = 'Không thể xác thực người dùng.';

      // Xử lý chi tiết lỗi JWT (nếu có)
      if (info) {
        switch (info.name || info.message) {
          case 'TokenExpiredError':
          case 'jwt expired':
            message = 'Token đã hết hạn, vui lòng đăng nhập lại.';
            break;
          case 'JsonWebTokenError':
          case 'invalid signature':
            message = 'Token không hợp lệ.';
            break;
          case 'No auth token':
          case 'No authorization token was found':
            message = 'Không tìm thấy token xác thực.';
            break;
          default:
            message = info.message || message;
            break;
        }
      }

      throw new UnauthorizedException(message);
    }

    // Nếu xác thực thành công, trả về user
    return user;
  }
}
