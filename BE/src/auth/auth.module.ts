import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    // Đăng ký Passport (mặc định JWT, nhưng có thể dùng nhiều strategy như Google)
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),

    // Đăng ký JWT module động (lấy config từ .env)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<number>('JWT_EXPIRES_IN');
        return {
          secret: configService.get<string>('JWT_SECRET', 'super-secret-key'),
          signOptions: {
            expiresIn: expiresIn ?? 60 * 60 * 24 * 7, // 7 days
          },
        };
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,     // Dùng cho login bằng JWT
  ],

  exports: [AuthService],
})
export class AuthModule {}
