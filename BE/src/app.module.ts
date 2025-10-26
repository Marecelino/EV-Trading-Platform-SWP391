// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ListingsModule } from './listings/listings.module';
import { AuthModule } from './auth/auth.module';
import { ContractsModule } from './contracts/contracts.module';
import { PaymentModule } from './payment/payment.module';
import { SignnowModule } from './signnow/signnow.module';
import { Transaction } from './model/transactions';
import { TransactionsModule } from './transactions/transactions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactsModule } from './contacts/contacts.module';
import { EvdetailsModule } from './evdetails/evdetails.module';
import { PriceSuggestion } from './model/pricesuggestions';
import { PriceSuggestionsModule } from './pricesuggestions/pricesuggestions.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URL: Joi.string().uri().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
        FACEBOOK_CLIENT_ID: Joi.string().required(),
        FACEBOOK_CLIENT_SECRET: Joi.string().required(),
        FACEBOOK_CALLBACK_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().optional(),
        DEFAULT_ADMIN_EMAIL: Joi.string()
          .email({ tlds: { allow: false } })
          .optional(),
        DEFAULT_ADMIN_PASSWORD: Joi.string().min(6).optional(),
        DEFAULT_ADMIN_NAME: Joi.string().min(2).optional(),
        DEFAULT_MEMBER_EMAIL: Joi.string()
          .email({ tlds: { allow: false } })
          .optional(),
        DEFAULT_MEMBER_PASSWORD: Joi.string().min(6).optional(),
        DEFAULT_MEMBER_NAME: Joi.string().min(2).optional(),
        FRONTEND_URL: Joi.string().uri().optional(),
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
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
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),
    ListingsModule,
    AuthModule,
    ContractsModule,
    PaymentModule,
    SignnowModule,
    TransactionsModule,
    ReviewsModule,
    ContactsModule,
    EvdetailsModule,
    PriceSuggestionsModule,
    FavoritesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
