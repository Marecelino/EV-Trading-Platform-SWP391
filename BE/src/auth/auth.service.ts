import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { User, UserDocument } from '../model/users.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService
  ) {}

  /** Đăng ký tài khoản với email/password */
  async register(dto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email: dto.email });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      
      // Create new user
      const newUser = new this.userModel({
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role || 'user',
        phone: dto.phone,
        address: dto.address,
      });

      const savedUser = await newUser.save();
      console.log('User saved successfully:', savedUser._id);

      const payload = { 
        sub: savedUser._id.toString(), 
        email: savedUser.email, 
        role: savedUser.role 
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        user: this.sanitizeUser(savedUser),
        access_token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /** Đăng nhập email/password */
  async login(dto: { email: string; password: string }) {
    try {
      const user = await this.userModel.findOne({ email: dto.email });
      if (!user) {
        throw new BadRequestException('Invalid email or password');
      }

      // Check if user has password (OAuth users might not have password)
      if (!user.password) {
        throw new BadRequestException('Please login with your social account');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const payload = { 
        sub: user._id.toString(), 
        email: user.email, 
        role: user.role 
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        user: this.sanitizeUser(user),
        access_token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /** Get all users (Admin only) */
  async findAllUsers(): Promise<any[]> {
    try {
      const users = await this.userModel.find().select('-password -refreshTokenHash -passwordResetToken -passwordResetExpires');
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      console.error('Find all users error:', error);
      throw error;
    }
  }

  /** Find user by ID */
  async findUserById(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(id);
    } catch (error) {
      console.error('Find user by ID error:', error);
      return null;
    }
  }

  /** Find user by email */
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email });
    } catch (error) {
      console.error('Find user by email error:', error);
      return null;
    }
  }

  /** Update user */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check email uniqueness if email is being updated
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userModel.findOne({ email: updateUserDto.email });
        if (existingUser) {
          throw new BadRequestException('Email already exists');
        }
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        updateUserDto,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /** Delete user */
  async deleteUser(id: string): Promise<void> {
    try {
      const result = await this.userModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /** Change password */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.password) {
        throw new BadRequestException('Cannot change password for OAuth users');
      }

      const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();

      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /** Get users by role */
  async findUsersByRole(role: string): Promise<any[]> {
    try {
      const users = await this.userModel.find({ role }).select('-password -refreshTokenHash -passwordResetToken -passwordResetExpires');
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      console.error('Find users by role error:', error);
      throw error;
    }
  }

  /** Get user statistics */
  async getUserStats(): Promise<{ total: number; byRole: Record<string, number>; byStatus: Record<string, number> }> {
    try {
      const [total, roleStats, statusStats] = await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        this.userModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      ]);

      const byRole = roleStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const byStatus = statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return { total, byRole, byStatus };
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /** Search users by name or email */
  async searchUsers(query: string): Promise<any[]> {
    try {
      const users = await this.userModel
        .find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        })
        .select('-password -refreshTokenHash -passwordResetToken -passwordResetExpires');
      
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /** Remove password from user object */
  private sanitizeUser(user: UserDocument): any {
    if (!user) return null;
    
    const userObj = user.toObject ? user.toObject() : user;
    
    // Remove sensitive fields
    delete userObj.password;
    delete userObj.refreshTokenHash;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    
    return userObj;
  }
}