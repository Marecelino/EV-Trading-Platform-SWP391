import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService, SanitizedUser } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../model/users.schema';

interface AuthPayload {
  accessToken: string;
  user: SanitizedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private createAccessToken(userId: string, role: UserRole): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  async register(registerDto: RegisterDto) {
    const createdUser = await this.usersService.create({
      ...registerDto,
      role: undefined,
    });

    const sanitizedUser = await this.usersService.findById(
      createdUser._id.toString(),
    );

    return {
      accessToken: this.createAccessToken(
        sanitizedUser._id,
        sanitizedUser.role,
      ),
      user: sanitizedUser,
    } satisfies AuthPayload;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    await this.usersService.recordLastLogin(user._id.toString());

    const sanitizedUser = await this.usersService.findById(user._id.toString());

    return {
      accessToken: this.createAccessToken(
        sanitizedUser._id,
        sanitizedUser.role,
      ),
      user: sanitizedUser,
    } satisfies AuthPayload;
  }
}
