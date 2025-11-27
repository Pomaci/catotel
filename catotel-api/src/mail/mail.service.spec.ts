import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

const createConfig = (overrides: Record<string, any> = {}) =>
  ({
    get: (key: string) => overrides[key],
    getOrThrow: (key: string) => overrides[key],
  } as unknown as ConfigService<any>);

describe('MailService', () => {
  it('disables when MAIL_ENABLED is false', async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: createConfig({ MAIL_ENABLED: false }),
        },
      ],
    }).compile();

    const svc = module.get(MailService);
    await svc.onModuleInit();
    expect(svc.enabled).toBe(false);
  });

  it('logs missing MAIL_FROM and disables', async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: createConfig({
            MAIL_ENABLED: true,
            SMTP_HOST: 'smtp.test',
            SMTP_PORT: 587,
            SMTP_USERNAME: 'u',
            SMTP_PASSWORD: 'p',
          }),
        },
      ],
    }).compile();
    const svc = module.get(MailService);
    await svc.onModuleInit();
    expect(svc.enabled).toBe(false);
  });

  it('initializes transporter and sends mail when enabled', async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: createConfig({
            MAIL_ENABLED: true,
            MAIL_FROM: 'no-reply@test.com',
            SMTP_HOST: 'smtp.test',
            SMTP_PORT: 587,
            SMTP_USERNAME: 'u',
            SMTP_PASSWORD: 'p',
          }),
        },
      ],
    }).compile();
    const svc = module.get(MailService);
    await svc.onModuleInit();
    expect(svc.enabled).toBe(true);
    await expect(
      svc.sendMail({ to: 'a@test.com', subject: 'Test', html: '<p>Hi</p>' }),
    ).resolves.toBeUndefined();
  });
});
