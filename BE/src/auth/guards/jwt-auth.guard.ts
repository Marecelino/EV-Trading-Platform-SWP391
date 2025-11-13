import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request | undefined>();
    if (request) {
      const url = request.originalUrl || request.url;
      if (url && (url.startsWith('/docs') || url.startsWith('/docs-json'))) {
        return true;
      }
    }

    return super.canActivate(context);
  }


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

    return user;
  }
}
