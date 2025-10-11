import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SELLER = 'seller'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

@Schema({
  timestamps: true
})
export class User extends Document {
    @Prop({ 
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    })
    name: string;

    @Prop({ 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    })
    email: string;

    @Prop({ 
      type: String,
      enum: UserRole,
      default: UserRole.USER
    })
    role: UserRole;

    @Prop({ 
      required: true,
      minlength: 6
    })
    password: string;

    @Prop({ 
      type: String,
      enum: UserStatus,
      default: UserStatus.ACTIVE
    })
    status: UserStatus;

    @Prop()
    phone: string;

    @Prop()
    address: string;

    @Prop()
    avatar: string;

    @Prop({ default: Date.now })
    lastLogin: Date;

    @Prop({ default: false })
    isEmailVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Tạo indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });

// Pre-save middleware để hash password (sẽ cần bcrypt)
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   // Hash password logic here
//   next();
// });

