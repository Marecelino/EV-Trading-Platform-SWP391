import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  RegisterDto,
  UpdateUserDto,
  ChangePasswordDto,
  CompleteRegistrationDto,
} from './dto';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../model/users.schema';

interface OAuthProfilePayload {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  /** Đăng ký tài khoản với email/password */
  async register(dto: RegisterDto) {
    try {
      // Check if user already exists
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create new user in inactive state until profile is completed
      const newUser = new this.userModel({
        email: normalizedEmail,
        password: hashedPassword,
        role: UserRole.USER,
        status: UserStatus.INACTIVE,
        isEmailVerified: false,
        profileCompleted: false,
      });

      const savedUser = await newUser.save();

      return {
        success: true,
        message:
          'Đăng ký thành công. Vui lòng hoàn tất thông tin cá nhân để kích hoạt tài khoản.',
        data: {
          userId: savedUser._id.toString(),
          email: savedUser.email,
          requiresProfileCompletion: true,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profileCompleted) {
      throw new BadRequestException('Profile already completed');
    }

    user.name = dto.fullName;
    user.phone = dto.phone;
    user.address = dto.address;
    user.dateOfBirth = new Date(dto.dateOfBirth);
    user.profileCompleted = true;
    user.status = UserStatus.ACTIVE;

    await user.save();

    const token = await this.signToken(user);

    return {
      success: true,
      message: 'Hoàn tất đăng ký thành công',
      data: {
        user: this.sanitizeUser(user),
        token,
      },
    };
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

      const isProfileCompleted =
        user.profileCompleted === undefined ? true : user.profileCompleted;
      if (!isProfileCompleted || user.status !== UserStatus.ACTIVE) {
        throw new BadRequestException(
          'Tài khoản chưa được kích hoạt. Vui lòng hoàn tất thông tin cá nhân.',
        );
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = await this.signToken(user);

      return {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: this.sanitizeUser(user),
          token,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async handleOAuthLogin(payload: OAuthProfilePayload): Promise<{
    success: true;
    data: { user: any; token: string };
    isNewUser: boolean;
  }> {
    if (!payload.email) {
      throw new BadRequestException(
        'Không thể xác thực tài khoản vì nhà cung cấp không trả về email.',
      );
    }

    let user = await this.userModel.findOne({
      'oauthProviders.provider': payload.provider,
      'oauthProviders.providerId': payload.providerId,
    });

    let isNewUser = false;

    if (!user) {
      user = await this.userModel.findOne({ email: payload.email });
    }

    if (!user) {
      user = new this.userModel({
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
        avatar: payload.avatarUrl ?? undefined,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        oauthProviders: [
          {
            provider: payload.provider,
            providerId: payload.providerId,
          },
        ],
      });
      isNewUser = true;
    } else {
      const hasProvider = user.oauthProviders?.some(
        (provider) =>
          provider.provider === payload.provider &&
          provider.providerId === payload.providerId,
      );

      if (!hasProvider) {
        user.oauthProviders = [
          ...(user.oauthProviders ?? []),
          {
            provider: payload.provider,
            providerId: payload.providerId,
          },
        ];
      }

      if (!user.name && payload.name) {
        user.name = payload.name;
      }

      if (!user.avatar && payload.avatarUrl) {
        user.avatar = payload.avatarUrl;
      }

      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = await this.signToken(user);

    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
        token,
      },
      isNewUser,
    };
  }

  /** Get all users (Admin only) */
  async findAllUsers(): Promise<any[]> {
    try {
      const users = await this.userModel
        .find()
        .select(
          '-password -refreshTokenHash -passwordResetToken -passwordResetExpires',
        );
      return users.map((user) => this.sanitizeUser(user));
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

  async getProfile(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
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
        const existingUser = await this.userModel.findOne({
          email: updateUserDto.email,
        });
        if (existingUser) {
          throw new BadRequestException('Email already exists');
        }
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        updateUserDto,
        { new: true, runValidators: true },
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
  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.password) {
        throw new BadRequestException('Cannot change password for OAuth users');
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );
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
      const users = await this.userModel
        .find({ role })
        .select(
          '-password -refreshTokenHash -passwordResetToken -passwordResetExpires',
        );
      return users.map((user) => this.sanitizeUser(user));
    } catch (error) {
      console.error('Find users by role error:', error);
      throw error;
    }
  }

  /** Get user statistics */
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const [total, roleStats, statusStats] = await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
        this.userModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
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
            { email: { $regex: query, $options: 'i' } },
          ],
        })
        .select(
          '-password -refreshTokenHash -passwordResetToken -passwordResetExpires',
        );

      return users.map((user) => this.sanitizeUser(user));
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  private async signToken(user: UserDocument): Promise<string> {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  /** Remove sensitive fields & chuẩn hóa dữ liệu cho FE */
  private sanitizeUser(
    user: UserDocument | (UserDocument & { toObject?: () => any }) | any,
  ): any {
    if (!user) return null;

    const raw = typeof user.toObject === 'function' ? user.toObject() : user;
    const {
      password,
      refreshTokenHash,
      passwordResetToken,
      passwordResetExpires,
      __v,
      ...rest
    } = raw;

    const id =
      raw._id?.toString?.() ?? raw.id?.toString?.() ?? raw._id ?? raw.id;
    const fallbackName =
      raw.name ?? rest.full_name ?? (raw.email ? raw.email.split('@')[0] : '');
    const fullName = rest.full_name ?? raw.name ?? fallbackName;
    const avatarUrl = rest.avatar_url ?? raw.avatar ?? null;
    const dateOfBirthValue =
      raw.dateOfBirth ?? rest.dateOfBirth ?? rest.date_of_birth ?? undefined;

    let normalizedDob: string | undefined;
    if (dateOfBirthValue instanceof Date) {
      normalizedDob = dateOfBirthValue.toISOString().split('T')[0];
    } else if (typeof dateOfBirthValue === 'string' && dateOfBirthValue) {
      const parsed = new Date(dateOfBirthValue);
      normalizedDob = Number.isNaN(parsed.getTime())
        ? undefined
        : parsed.toISOString().split('T')[0];
    }

    return {
      ...rest,
      _id: id,
      id,
      name: raw.name ?? fullName,
      full_name: fullName,
      avatar: raw.avatar ?? avatarUrl ?? undefined,
      avatar_url: avatarUrl ?? undefined,
      dateOfBirth: normalizedDob,
      profileCompleted: Boolean(
        rest.profileCompleted ?? raw.profileCompleted ?? true,
      ),
      oauthProviders: Array.isArray(raw.oauthProviders)
        ? raw.oauthProviders
        : [],
    };
  }
}
