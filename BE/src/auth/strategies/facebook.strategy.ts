import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyFunction } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

interface FacebookVerifyCallback extends VerifyFunction {
  (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): void;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('FACEBOOK_CLIENT_ID', ''),
      clientSecret: config.get<string>('FACEBOOK_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL', ''),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      enableProof: true,
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    const user = {
      provider: 'facebook' as const,
      providerId: profile.id,
      email: profile.emails?.[0]?.value?.toLowerCase() ?? null,
      name: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      accessToken,
    };

    done(null, user);
  }
}
