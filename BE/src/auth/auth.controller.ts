import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';

// DTOs
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

// Interfaces / Types
import { SanitizedUser } from '../users/users.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: SanitizedUser;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Đăng ký tài khoản
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ✅ Đăng nhập thường (JWT)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ✅ Lấy thông tin người dùng hiện tại
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  // ✅ GOOGLE LOGIN — Bước 1: chuyển hướng đến trang Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport sẽ tự redirect đến Google login
  }

  // ✅ GOOGLE LOGIN — Bước 2: Google redirect về callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req: any) {
    // req.user được tạo từ GoogleStrategy.validate()
    const { user } = req;
    // Trả JWT cho FE hoặc redirect tùy mục đích
    return this.authService.googleLogin(user);
  }
}
