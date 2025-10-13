import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../model/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import * as crypto from 'crypto';

const PASSWORD_SALT_ROUNDS = 10;

type LeanUser = Omit<User, 'password'> & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isEmailVerified?: boolean;
  // nếu bạn có các trường mới, thêm ở đây
};

export type SanitizedUser = Omit<LeanUser, '_id'> & { _id: string };

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private toSanitizedUser(user: LeanUser): SanitizedUser {
    const { _id, ...rest } = user;
    return {
      ...rest,
      _id: _id.toString(),
    };
  }

  /**
   * Tạo user mới — trả về sanitized user (không có password)
   */
  async create(createUserDto: CreateUserDto): Promise<SanitizedUser> {
    // chuẩn hoá email
    const email = createUserDto.email.toLowerCase();

    // kiểm tra tồn tại sớm
    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      PASSWORD_SALT_ROUNDS,
    );

    const createdUser = new this.userModel({
      ...createUserDto,
      email,
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.USER,
    });

    try {
      const saved = await createdUser.save();
      // chuyển thành plain object, xóa password trước khi trả
      const obj = (saved as any).toObject ? (saved as any).toObject() : saved;
      delete obj.password;
      // đảm bảo kiểu LeanUser cho toSanitizedUser
      return this.toSanitizedUser(obj as LeanUser);
    } catch (err: any) {
      // duplicate key (race condition)
      if (err && err.code === 11000) {
        throw new ConflictException('Email already in use');
      }
      // Mongoose validation error
      if (err && err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        throw new BadRequestException(messages.join(', '));
      }
      throw err;
    }
  }

  async findAll(
    filter: FilterUsersDto = {},
    page = 1,
    limit = 20,
  ): Promise<{
    data: SanitizedUser[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query: FilterQuery<User> = {};

    if (filter.role) {
      query.role = filter.role;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const data = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean<LeanUser[]>();

    const total = await this.userModel.countDocuments(query);

    const sanitizedData = data.map((user) => this.toSanitizedUser(user));

    return {
      data: sanitizedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<SanitizedUser> {
    const user = await this.userModel
      .findById(id)
      .select('-password')
      .lean<LeanUser>();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSanitizedUser(user);
  }

  /**
   * Trả về document đầy đủ (có password, refreshTokenHash...) — dùng trong auth
   */
  async findByIdRaw(id: string) {
    return this.userModel.findById(id).exec();
  }

  /**
   * Trả về document (có password) theo email — dùng để login
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async updateProfile(
    id: string,
    updateDto: UpdateUserDto,
  ): Promise<SanitizedUser> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateDto, { new: true, runValidators: true })
      .select('-password')
      .lean<LeanUser>();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSanitizedUser(user);
  }

  async changeStatus(
    id: string,
    changeStatusDto: ChangeStatusDto,
  ): Promise<SanitizedUser> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { status: changeStatusDto.status },
        { new: true, runValidators: true },
      )
      .select('-password')
      .lean<LeanUser>();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSanitizedUser(user);
  }

  async recordLastLogin(id: string) {
    await this.userModel
      .findByIdAndUpdate(id, { lastLogin: new Date() })
      .exec();
  }

  async remove(id: string): Promise<SanitizedUser> {
    const result = await this.userModel
      .findByIdAndDelete(id)
      .select('-password')
      .lean<LeanUser>();
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return this.toSanitizedUser(result);
  }

  // ---------------------------
  // Methods for auth flows
  // ---------------------------

  /**
   * Lưu / xóa hashed refresh token (dùng cho refresh/logout)
   */
  async updateRefreshToken(id: string, refreshTokenHash: string | null) {
    await this.userModel
      .findByIdAndUpdate(id, { refreshTokenHash }, { new: true })
      .exec();
  }

  /**
   * Lưu token reset + expires
   */
  async setPasswordResetToken(id: string, token: string, expires: Date) {
    await this.userModel
      .findByIdAndUpdate(id, { passwordResetToken: token, passwordResetExpires: expires }, { new: true })
      .exec();
  }

  /**
   * Tìm user theo reset token
   */
  async findByResetToken(token: string) {
    return this.userModel.findOne({ passwordResetToken: token }).exec();
  }

  /**
   * Cập nhật mật khẩu và clear reset token fields
   */
  async updatePasswordAndClearReset(id: string, hashedPassword: string) {
    await this.userModel.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    }).exec();
  }

  /**
   * ensure admin seed nhưng không crash app khi lỗi xảy ra
   */
  async ensureAdminSeed() {
    try {
      const adminExists = await this.userModel.exists({ role: UserRole.ADMIN });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('Admin123!', PASSWORD_SALT_ROUNDS);
        await this.userModel.create({
          name: 'Platform Administrator',
          email: 'admin@ev-platform.test',
          password: hashedPassword,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
        });
      }
    } catch (err: any) {
      // log và tiếp tục — tránh crash server
      console.warn('Admin seed failed:', err?.message || err);
    }
  }
// ========== OAUTH HELPERS (phù hợp schema hiện tại — chưa lưu providerId) ==========

// Hiện schema chưa lưu provider/providerId ⇒ tạm thời không tra theo providerId
async findByProviderId(_provider: string, _providerId: string) {
  return null;
}

// Tạo user từ OAuth với mật khẩu tạm (để thỏa 'password' đang required trong schema)
async createFromOAuth(opts: {
  email: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  provider: string;
  providerId: string;
}) {
  const email =
    (opts.email ?? '').toLowerCase() ||
    `${opts.providerId}@${opts.provider}.local`; // fallback nếu không có email

  // nếu email đã tồn tại → trả về luôn
  const existed = await this.userModel.findOne({ email }).exec();
  if (existed) return existed;

  const tempPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(tempPassword, PASSWORD_SALT_ROUNDS);

  const doc = await this.userModel.create({
    name: opts.name ?? 'New User',
    email,
    password: hashedPassword,
    avatar: opts.avatarUrl ?? undefined,
    isEmailVerified: !!opts.email,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  return doc;
}

// Hiện chưa lưu provider trong schema → no-op (để code ở AuthService không lỗi)
async linkProvider(_userId: string, _provider: string, _providerId: string) {
  return;
}

}

