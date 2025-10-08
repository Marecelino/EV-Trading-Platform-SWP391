import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User, LoginResponse } from './auth.interface';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private jwtService: JwtService) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }
    this.googleClient = new OAuth2Client(clientId);
  }

  async googleLogin(user: any): Promise<LoginResponse> {
    if (!user) {
      throw new Error('No user from google');
    }

    // Tại đây bạn có thể kiểm tra user trong database
    // Nếu user chưa tồn tại, tạo mới
    // Nếu đã tồn tại, cập nhật thông tin

    const userData: User = {
      _id: user.googleId, // Hoặc ID từ database
      email: user.email,
      full_name: user.full_name,
      picture: user.picture,
      role: 'member', // Mặc định là member
    };

    const payload = {
      email: user.email,
      sub: user.googleId, // hoặc user._id từ database
      full_name: user.full_name,
      role: userData.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Google login successful',
      data: {
        user: userData,
        token,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    // Tại đây bạn sẽ kiểm tra email và password trong database
    // Đây chỉ là ví dụ mock
    if (email === 'admin@example.com' && password === 'admin123') {
      return {
        _id: '1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        role: 'admin',
      };
    }
    return null;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user._id,
      full_name: user.full_name,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    };
  }

  async googleLoginWithCredential(credential: string): Promise<LoginResponse> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      // Tại đây bạn có thể kiểm tra user trong database
      // Nếu user chưa tồn tại, tạo mới
      // Nếu đã tồn tại, cập nhật thông tin

      const userData: User = {
        _id: payload.sub, // Google user ID
        googleId: payload.sub,
        email: payload.email!,
        full_name: payload.name!,
        picture: payload.picture,
        role: 'member', // Mặc định là member
      };

      const jwtPayload = {
        email: userData.email,
        sub: userData._id,
        full_name: userData.full_name,
        role: userData.role,
      };

      const token = this.jwtService.sign(jwtPayload);

      return {
        success: true,
        message: 'Google login successful',
        data: {
          user: userData,
          token,
        },
      };
    } catch (error) {
      throw new Error('Google authentication failed: ' + error.message);
    }
  }
}
