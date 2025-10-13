// src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', ''),       // <-- dùng ConfigService
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', ''),// <--
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', ''),  // <--
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  // Trong Nest có thể return thẳng object thay vì dùng done()
  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value?.toLowerCase() ?? null;
    const name =
      profile.displayName ||
      [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ');
    const picture = profile.photos?.[0]?.value ?? null;

    // tuỳ bạn: tạo/tìm user + ký JWT
    // ví dụ gọi vào AuthService của bạn
    const result = await this.authService.loginWithOAuthProfile({
      provider: 'google',
      providerId: profile.id,
      email,
      name,
      avatarUrl: picture,
      accessToken,
    });

    // req.user = result
    return result;
  }
}
  