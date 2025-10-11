import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, JwtFromRequestFunction } from 'passport-jwt';
import { UsersService, SanitizedUser } from '../../users/users.service';
import { UserRole } from '../../model/users.schema';

interface JwtPayload {
  sub: string;
  role: UserRole;
}

interface JwtValidatedUser extends SanitizedUser {
  userId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
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

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    const user = await this.usersService.findById(payload.sub);
    return { ...user, role: payload.role, userId: payload.sub };
  }
}
