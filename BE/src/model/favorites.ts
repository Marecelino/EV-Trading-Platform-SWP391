import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { Listing } from './listings';

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({
  timestamps: true,
})
export class Favorite {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user_id: Types.ObjectId | User;

  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: true,
  })
  listing_id: Types.ObjectId | Listing;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// Unique constraint: một user chỉ có thể favorite một listing một lần
FavoriteSchema.index({ user_id: 1, listing_id: 1 }, { unique: true });

// Indexes for queries
FavoriteSchema.index({ user_id: 1, createdAt: -1 });
FavoriteSchema.index({ listing_id: 1 });
