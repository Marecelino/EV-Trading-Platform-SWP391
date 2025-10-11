import {
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

const PASSWORD_SALT_ROUNDS = 10;

type LeanUser = Omit<User, 'password'> & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isEmailVerified?: boolean;
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

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .lean();
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      PASSWORD_SALT_ROUNDS,
    );
    const createdUser = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.USER,
    });
    return createdUser.save();
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

  async ensureAdminSeed() {
    const adminExists = await this.userModel.exists({ role: UserRole.ADMIN });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(
        'Admin123!',
        PASSWORD_SALT_ROUNDS,
      );
      await this.userModel.create({
        name: 'Platform Administrator',
        email: 'admin@ev-platform.test',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
    }
  }
}
