import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthTokensService } from './tokens/token.service';
import { UserService } from 'src/user/user.service';

describe('AuthService', () => {
  let service: AuthService;

  const sessionRepoMock = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };
  const prismaMock = {
    session: sessionRepoMock,
    $transaction: jest.fn(
      (cb: (tx: { session: typeof sessionRepoMock }) => unknown) =>
        Promise.resolve(
          cb({
            session: {
              findMany: jest.fn().mockResolvedValue([]),
              updateMany: jest.fn(),
              create: jest.fn(),
            } as typeof sessionRepoMock,
          }),
        ),
    ),
  };
  const tokensMock = {
    generateTokenPair: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };
  const userServiceMock = {
    findByEmail: jest.fn(),
  };
  const configServiceMock = {
    get: jest.fn().mockReturnValue(3),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuthTokensService, useValue: tokensMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
