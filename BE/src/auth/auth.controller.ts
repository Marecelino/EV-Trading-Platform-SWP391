import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';

// DTOs
import {
  RegisterDto,
  LoginDto,
  UpdateUserDto,
  ChangePasswordDto,
  CompleteRegistrationDto,
} from './dto';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User } from 'src/model/users.schema';
import { Roles } from './decorators/roles.decorator';
import { UserRole, UserStatus } from '../model/users.schema';
import { Public } from './decorators/public.decorator';
import { ListingsService } from '../listings/listings.service';
import { ListingStatus } from '../model/listings';
import { TransactionsService } from '../transactions/transactions.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: Omit<User, 'password'> & { userId: string };
}

interface OAuthPassportUser {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly listingsService: ListingsService,
    private readonly transactionsService: TransactionsService,
  ) { }

  // ✅ Đăng ký tài khoản
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({
    status: 400,
    description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('register/complete')
  @ApiOperation({ summary: 'Hoàn tất thông tin cá nhân sau khi đăng ký' })
  @ApiResponse({ status: 200, description: 'Hoàn tất đăng ký thành công' })
  completeRegistration(@Body() dto: CompleteRegistrationDto) {
    return this.authService.completeRegistration(dto);
  }

  // ✅ Đăng nhập
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 400, description: 'Email hoặc mật khẩu không đúng' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ✅ Lấy thông tin người dùng hiện tại
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin profile của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  // ✅ Cập nhật thông tin người dùng hiện tại
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({
    summary: 'Cập nhật thông tin profile của người dùng hiện tại',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(req.user.userId, updateUserDto);
  }

  // ✅ Đổi mật khẩu
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 401, description: 'Mật khẩu hiện tại không đúng' })
  changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  // ✅ Lấy danh sách tất cả người dùng (Admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  // ✅ Tìm kiếm người dùng
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users/search')
  @ApiOperation({ summary: 'Tìm kiếm người dùng theo tên hoặc email' })
  @ApiQuery({ name: 'q', description: 'Từ khóa tìm kiếm', example: 'nguyen' })
  @ApiResponse({ status: 200, description: 'Tìm kiếm thành công' })
  searchUsers(@Query('q') query: string) {
    return this.authService.searchUsers(query);
  }

  // ✅ Lấy thống kê người dùng
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users/stats')
  @ApiOperation({ summary: 'Lấy thống kê người dùng' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  getUserStats() {
    return this.authService.getUserStats();
  }

  // ✅ Lấy người dùng theo vai trò
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users/by-role/:role')
  @ApiOperation({ summary: 'Lấy danh sách người dùng theo vai trò' })
  @ApiParam({
    name: 'role',
    description: 'Vai trò người dùng',
    example: 'user',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findUsersByRole(@Param('role') role: string) {
    return this.authService.findUsersByRole(role);
  }

  // ✅ Lấy thông tin người dùng theo ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users/:id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID người dùng',
    example: 'user_1729012345678_abc123def',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async findUserById(@Param('id') id: string) {
    const user = await this.authService.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users/:id/listings')
  @ApiOperation({ summary: 'Lấy danh sách tin đăng (xe/pin) của người dùng' })
  @ApiParam({
    name: 'id',
    description: 'ID người dùng',
    example: '671234567890abcdef123456',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Trang cần lấy (bắt đầu từ 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số bản ghi mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Lọc theo trạng thái tin đăng',
    enum: ListingStatus,
  })
  async getUserListings(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ListingStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.listingsService.findBySeller(id, pageNum, limitNum, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('users/:id/transactions')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch của người dùng' })
  @ApiParam({
    name: 'id',
    description: 'ID người dùng',
    example: '671234567890abcdef123456',
  })
  @ApiQuery({
    name: 'as',
    required: false,
    description: 'Lọc theo vai trò của người dùng trong giao dịch',
    enum: ['buyer', 'seller'],
  })
  getUserTransactions(
    @Param('id') id: string,
    @Query('as') asRole?: 'buyer' | 'seller',
  ) {
    const roleFilter =
      asRole === 'buyer' || asRole === 'seller' ? asRole : undefined;
    return this.transactionsService.findForUser(id, roleFilter);
  }

  // ✅ Cập nhật thông tin người dùng theo ID (Admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Put('users/:id')
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng theo ID (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID người dùng',
    example: 'user_1729012345678_abc123def',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(id, updateUserDto);
  }

  // ✅ Xóa người dùng theo ID (Admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete('users/:id')
  @ApiOperation({ summary: 'Xóa người dùng theo ID (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'ID người dùng',
    example: 'user_1729012345678_abc123def',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('users/:id/approve')
  @ApiOperation({ summary: 'Phê duyệt tài khoản (Admin)' })
  approveUser(@Param('id') id: string) {
    return this.authService.approveUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Khóa / banned tài khoản (Admin)' })
  banUser(@Param('id') id: string) {
    return this.authService.setUserStatus(id, UserStatus.BANNED);
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Request() req: ExpressRequest & { user: OAuthPassportUser },
    @Res() res: Response,
  ) {
    return this.handleSocialRedirect(req.user, res);
  }

  @Get('facebook')
  @Public()
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    return;
  }

  @Get('facebook/callback')
  @Public()
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(
    @Request() req: ExpressRequest & { user: OAuthPassportUser },
    @Res() res: Response,
  ) {
    return this.handleSocialRedirect(req.user, res);
  }

  private async handleSocialRedirect(
    passportUser: OAuthPassportUser,
    res: Response,
  ) {
    const baseUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const redirectUrl = new URL(`${baseUrl}/auth/social/callback`);

    if (!passportUser) {
      redirectUrl.searchParams.set(
        'error',
        'Thiếu thông tin người dùng từ nhà cung cấp.',
      );
      return res.redirect(redirectUrl.toString());
    }

    try {
      const result = await this.authService.handleOAuthLogin(passportUser);
      redirectUrl.searchParams.set('token', result.data.token);
      redirectUrl.searchParams.set('provider', passportUser.provider);
      if (result.isNewUser) {
        redirectUrl.searchParams.set('isNew', '1');
      }
    } catch (error: any) {
      const message =
        error?.message || 'Không thể đăng nhập bằng tài khoản mạng xã hội.';
      redirectUrl.searchParams.set('error', message);
    }

    return res.redirect(redirectUrl.toString());
  }
}
