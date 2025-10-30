import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from '../model/favorites';
import { User, UserSchema } from '../model/users.schema';
import { ListingsModule } from '../listings/listings.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ListingsModule,
    AuctionsModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule { }
