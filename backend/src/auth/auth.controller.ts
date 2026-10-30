import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() request: { user: { sub: number } }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(request.user.sub, dto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  resetPassword(@Request() request: { user: { role: string } }, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(request.user.role, dto);
  }
}
