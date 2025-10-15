// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactsModule } from './contacts/contacts.module';
import { EvdetailsModule } from './evdetails/evdetails.module';
import { ModelsModule } from './models/models.module';
import { PriceSuggestionsModule } from './pricesuggestions/pricesuggestions.module';

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
    AuthModule,
    ListingsModule,
    TransactionsModule,
    FavoritesModule,
    ReviewsModule,
    NotificationsModule,
    ContactsModule,
    EvdetailsModule,
    ModelsModule,
    PriceSuggestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
