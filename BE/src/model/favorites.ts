import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { Listing } from './listings';
import { Auction } from './auctions';

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({
  timestamps: true,
})
export class Favorite {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: false,
  })
  user_id: Types.ObjectId | User;

  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: false,
  })
  listing_id: Types.ObjectId | Listing;

  @Prop({
    type: Types.ObjectId,
    ref: 'Auction',
    required: false,
  })
  auction_id: Types.ObjectId | Auction;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index(
  { user_id: 1, listing_id: 1 },
  { unique: true, partialFilterExpression: { listing_id: { $exists: true } } },
);

FavoriteSchema.index(
  { user_id: 1, auction_id: 1 },
  { unique: true, partialFilterExpression: { auction_id: { $exists: true } } },
);
