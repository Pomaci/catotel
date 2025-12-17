import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset/password-reset.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    getActiveSessions: jest.fn(),
    revokeSession: jest.fn(),
  };
  const passwordResetMock = {
    requestReset: jest.fn(),
    resetPassword: jest.fn(),
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PasswordResetService, useValue: passwordResetMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
