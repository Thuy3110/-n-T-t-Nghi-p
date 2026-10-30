import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const username = dto.username.trim();
    const existedUser = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existedUser) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim(),
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: 'Đăng ký tài khoản thành công',
      data: user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        username: user.username,
        role: user.role,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại.');
    const matched = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matched) throw new BadRequestException('Mật khẩu hiện tại không đúng.');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: 'Đổi mật khẩu thành công.' };
  }

  async resetPassword(role: string, dto: ResetPasswordDto) {
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPER USER'].includes(role.toUpperCase())) {
      throw new UnauthorizedException('Bạn không có quyền cấp lại mật khẩu.');
    }
    const user = await this.prisma.user.findUnique({ where: { username: dto.username.trim() } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản cần cấp lại mật khẩu.');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: `Đã cấp lại mật khẩu cho tài khoản ${user.username}.` };
  }
}
