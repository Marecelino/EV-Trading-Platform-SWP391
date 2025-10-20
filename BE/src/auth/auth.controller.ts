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
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';

// DTOs
import { RegisterDto, LoginDto, UpdateUserDto, ChangePasswordDto } from './dto';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from 'src/model/users.schema';

interface AuthenticatedRequest extends ExpressRequest {
  user: Omit<User, 'password'> & { userId: string };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Đăng ký tài khoản
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ✅ Đăng nhập
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
    return req.user;
  }

  // ✅ Cập nhật thông tin người dùng hiện tại
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin profile của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  updateProfile(@Request() req: AuthenticatedRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(req.user.userId, updateUserDto);
  }

  // ✅ Đổi mật khẩu
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 401, description: 'Mật khẩu hiện tại không đúng' })
  changePassword(@Request() req: AuthenticatedRequest, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  // ✅ Lấy danh sách tất cả người dùng (Admin only)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  // ✅ Tìm kiếm người dùng
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('users/search')
  @ApiOperation({ summary: 'Tìm kiếm người dùng theo tên hoặc email' })
  @ApiQuery({ name: 'q', description: 'Từ khóa tìm kiếm', example: 'nguyen' })
  @ApiResponse({ status: 200, description: 'Tìm kiếm thành công' })
  searchUsers(@Query('q') query: string) {
    return this.authService.searchUsers(query);
  }

  // ✅ Lấy thống kê người dùng
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('users/stats')
  @ApiOperation({ summary: 'Lấy thống kê người dùng' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  getUserStats() {
    return this.authService.getUserStats();
  }

  // ✅ Lấy người dùng theo vai trò
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('users/by-role/:role')
  @ApiOperation({ summary: 'Lấy danh sách người dùng theo vai trò' })
  @ApiParam({ name: 'role', description: 'Vai trò người dùng', example: 'user' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findUsersByRole(@Param('role') role: string) {
    return this.authService.findUsersByRole(role);
  }

  // ✅ Lấy thông tin người dùng theo ID
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('users/:id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiParam({ name: 'id', description: 'ID người dùng', example: 'user_1729012345678_abc123def' })
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

  // ✅ Cập nhật thông tin người dùng theo ID (Admin only)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('users/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng theo ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID người dùng', example: 'user_1729012345678_abc123def' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(id, updateUserDto);
  }

  // ✅ Xóa người dùng theo ID (Admin only)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('users/:id')
  @ApiOperation({ summary: 'Xóa người dùng theo ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID người dùng', example: 'user_1729012345678_abc123def' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
