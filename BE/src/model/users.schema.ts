import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ trim: true, minlength: 2, maxlength: 50 })
  name?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // Chỉ bắt buộc khi KHÔNG có OAuth providers
  @Prop({
    minlength: 6,
    required: function (this: any) {
      return !(this.oauthProviders && this.oauthProviders.length > 0);
    },
  })
  password?: string;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop() phone?: string;
  @Prop() address?: string;
  @Prop() avatar?: string;
  @Prop({ type: Date }) dateOfBirth?: Date;

  @Prop({ default: false })
  profileCompleted: boolean;

  @Prop({ default: Date.now })
  lastLogin: Date;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: 0 })
  review_average?: number;

  @Prop({ default: 0 })
  review_count?: number;

  // ----- OAuth -----
  @Prop({
    type: [
      {
        provider: { type: String, required: true }, // ví dụ: 'google'
        providerId: { type: String, required: true }, // profile.id
      },
    ],
    default: [],
  })
  oauthProviders: { provider: string; providerId: string }[];

  // ----- Tokens phục vụ auth flows -----
  @Prop() refreshTokenHash?: string;
  @Prop() passwordResetToken?: string;
  @Prop() passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
// ❌ BỎ index trùng email (đã unique ở field):
// UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index(
  { 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 },
  { sparse: true },
);

// Pre-save hash password (tuỳ bạn bật)
// UserSchema.pre('save', async function (next) { ... });
