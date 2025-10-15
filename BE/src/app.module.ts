// app.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { BatteryDetailsModule } from './battery-details/battery-details.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { CommissionConfigsModule } from './commission-configs/commission-configs.module';
import { CommissionsModule } from './commissions/commissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URL: Joi.string().uri().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().uri().optional(),
        NODE_ENV: Joi.string().valid('development','test','production').default('development'),
      }),
    }),

    // Đọc URI từ ConfigService thay vì process.env
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URL'),
        autoIndex: cfg.get('NODE_ENV') !== 'production', // tránh build index tự động ở prod
      }),
    }),

    UsersModule,
    AuthModule,
    ListingsModule,
    TransactionsModule,
    FavoritesModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    AnalyticsModule,
    BatteryDetailsModule,
    BrandsModule,
    CategoriesModule,
    CommissionConfigsModule,
    CommissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    await this.usersService.ensureAdminSeed();
  }
}
