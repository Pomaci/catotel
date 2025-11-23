import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from 'src/config/config.schema';
import {
  createTransport,
  type Transporter,
  type SendMailOptions,
} from 'nodemailer';

type MailPayload = Omit<SendMailOptions, 'from'>;

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string | null;
  private readonly isEnabled: boolean;

  constructor(private readonly config: ConfigService<EnvVars>) {
    this.isEnabled = Boolean(this.config.get('MAIL_ENABLED', { infer: true }));

    if (!this.isEnabled) {
      this.logger.warn(
        'Mail service disabled. Set MAIL_ENABLED=true and configure SMTP settings to enable emails.',
      );
      this.fromAddress = null;
      return;
    }

    this.fromAddress = this.getEnvOrThrow('MAIL_FROM');
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      return;
    }

    try {
      await this.initializeTransporter();
      this.logger.log('SMTP transporter verified successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to initialize SMTP transporter. Emails will not be delivered.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  get enabled() {
    return this.isEnabled;
  }

  private getEnv<Key extends keyof EnvVars>(
    key: Key,
  ): EnvVars[Key] | undefined {
    return this.config.get(key, { infer: true });
  }

  private getEnvOrThrow<Key extends keyof EnvVars>(
    key: Key,
  ): NonNullable<EnvVars[Key]> {
    const value = this.getEnv(key);
    if (value === undefined || value === null) {
      throw new Error(
        `Missing required environment variable for mail service: ${String(key)}`,
      );
    }
    return value as NonNullable<EnvVars[Key]>;
  }

  private async initializeTransporter() {
    const host = this.getEnvOrThrow('SMTP_HOST');
    const port = this.getEnvOrThrow('SMTP_PORT');
    const secure = Boolean(this.getEnv('SMTP_SECURE'));
    const user = this.getEnv('SMTP_USERNAME');
    const pass = this.getEnv('SMTP_PASSWORD');

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    await this.transporter.verify();
  }

  async sendMail(options: MailPayload) {
    if (!this.isEnabled || !this.fromAddress) {
      this.logger.debug('Mail disabled. Skipping sendMail call.');
      return;
    }
    if (!this.transporter) {
      throw new Error('Mail transporter is not initialized yet.');
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        ...options,
      });
      const recipients = this.formatRecipients(options.to);
      this.logger.debug(`Mail sent to ${recipients}`);
    } catch (error) {
      this.logger.error(
        'Failed to send mail',
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name?: string) {
    if (!this.isEnabled) {
      return;
    }
    const subject = 'Miaow Hotel ekibinden merhaba';
    const salutation = name ? `Merhaba ${name},` : 'Merhaba,';
    const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <p>${salutation}</p>
          <p>Miaow Hotel ailesine katıldığın için teşekkür ederiz. Kedinin konaklamasını yönetmek, canlı yayın ile onu izlemek ve bakım planlarını oluşturmak için hesabını kullanabilirsin.</p>
          <p>Sevgiler,<br/>Miaow Hotel Ekibi</p>
        </body>
      </html>
    `;

    await this.sendMail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, link: string, name?: string) {
    if (!this.isEnabled) {
      return;
    }
    const salutation = name ? `Merhaba ${name},` : 'Merhaba,';
    const subject = 'Catotel şifre yenileme bağlantısı';
    const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <p>${salutation}</p>
          <p>Hesabın için yeni bir şifre belirlemek üzere aşağıdaki bağlantıyı kullanabilirsin. Bağlantı kısa süre sonra geçersiz olacaktır.</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color:#ffb673;color:#1f2933;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Yeni şifre belirle</a>
          </p>
          <p>Eğer bu isteği sen gerçekleştirmediysen bu e-postayı yok sayabilirsin.</p>
          <p>Sevgiler,<br/>Miaow Hotel Ekibi</p>
        </body>
      </html>
    `;

    await this.sendMail({ to, subject, html });
  }

  private formatRecipients(to: SendMailOptions['to']) {
    if (!to) {
      return 'unknown recipient';
    }
    if (Array.isArray(to)) {
      return to
        .map((recipient) =>
          typeof recipient === 'string' ? recipient : recipient.address,
        )
        .join(', ');
    }
    return typeof to === 'string' ? to : (to.address ?? 'unknown recipient');
  }
}
