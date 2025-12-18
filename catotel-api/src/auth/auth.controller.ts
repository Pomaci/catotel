import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt.guard';
import type { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset/password-reset.service';
import {
  localizedError,
  ERROR_CODES,
} from 'src/common/errors/localized-error.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @ApiOperation({ summary: 'Login with email/password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @Public()
  @Post('login')
  async login(@Req() req: Request, @Body() body: LoginDto) {
    const userAgent: string =
      (req.headers['user-agent'] as string) ?? 'Unknown';
    const ip =
      (Array.isArray(req.ips) && req.ips.length
        ? req.ips[0]
        : req.ip || (req.headers['x-forwarded-for'] as string)) ?? 'Unknown';

    return this.authService.login(body.email, body.password, userAgent, ip);
  }

  @ApiOperation({ summary: 'Rotate access/refresh tokens' })
  @ApiOkResponse({ type: AuthTokensDto })
  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    const { refresh_token } = body;
    if (!refresh_token) {
      throw new UnauthorizedException(
        localizedError(ERROR_CODES.AUTH_MISSING_CREDENTIALS),
      );
    }
    return this.authService.refreshToken(refresh_token);
  }

  @ApiOperation({
    summary: 'Invalidate the session that owns the given refresh token',
  })
  @ApiOkResponse({
    schema: {
      example: { message: 'Logged out successfully' },
    },
  })
  @Public()
  @Post('logout')
  async logout(@Body() body: RefreshTokenDto) {
    const { refresh_token } = body;
    if (!refresh_token) {
      throw new UnauthorizedException(
        localizedError(ERROR_CODES.AUTH_MISSING_CREDENTIALS),
      );
    }
    return this.authService.logout(refresh_token);
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Logged out from all devices' },
    },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: Request) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        localizedError(ERROR_CODES.AUTH_USER_NOT_IN_REQUEST),
      );
    }
    return this.authService.logoutAll(req.user.sub);
  }

  @ApiOperation({
    summary: 'List active sessions tied to the authenticated user',
  })
  @ApiOkResponse({ type: SessionResponseDto, isArray: true })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: Request) {
    return this.authService.getActiveSessions(req.user!.sub);
  }

  @ApiOperation({ summary: 'Revoke a single active session by id' })
  @ApiOkResponse({
    schema: { example: { message: 'Session revoked successfully' } },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke/:id')
  async revokeSession(@Req() req: Request, @Param('id') sessionId: string) {
    return this.authService.revokeSession(req.user!.sub, sessionId);
  }

  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiOkResponse({
    schema: {
      example: { message: 'If the email exists, a reset link will be sent.' },
    },
  })
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.passwordResetService.requestPasswordReset(body.email);
    return {
      message: 'If the email exists, a reset link will be sent.',
    };
  }

  @ApiOperation({ summary: 'Reset password via token' })
  @ApiOkResponse({
    schema: { example: { message: 'Password updated successfully' } },
  })
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.passwordResetService.resetPassword(body.token, body.password);
    return { message: 'Password updated successfully' };
  }
}
