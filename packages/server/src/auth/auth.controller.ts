import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../common/dtos/auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Ip() ipAddress: string) {
    return await this.authService.register(registerDto, ipAddress);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
    return await this.authService.login(loginDto, ipAddress);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Request() req: any,
  ) {
    // Extract user ID from refresh token (minimal validation)
    // In production, validate refresh token signature
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Invalid refresh token');
    }
    return await this.authService.refresh(refreshDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any) {
    return await this.authService.getCurrentUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.userId);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  async setupMfa(@Request() req: any) {
    return await this.authService.setupMfa(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmMfa(
    @Request() req: any,
    @Body() body: { token: string; secret: string },
  ) {
    await this.authService.confirmMfa(req.user.userId, body.token, body.secret);
    return { message: 'MFA enabled successfully' };
  }
}
