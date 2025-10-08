import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard, JwtAuthGuard } from './auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req) {
    // initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    try {
      const result = await this.authService.googleLogin(req.user);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/auth/google/success?token=${result.data.token}&user=${encodeURIComponent(JSON.stringify(result.data.user))}`,
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/auth/google/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Post('google/callback')
  async googleLoginWithCredential(@Body() body: { credential: string }) {
    try {
      // Decode and verify Google JWT credential
      const result = await this.authService.googleLoginWithCredential(
        body.credential,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return {
      success: true,
      data: req.user,
    };
  }
}
