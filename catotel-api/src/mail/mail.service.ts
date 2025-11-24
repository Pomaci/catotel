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
  private mailEnabled: boolean;
  private mailReady = false;

  constructor(private readonly config: ConfigService<EnvVars>) {
    this.mailEnabled = Boolean(
      this.config.get('MAIL_ENABLED', { infer: true }),
    );

    if (!this.mailEnabled) {
      this.logger.warn(
        'Mail service disabled. Set MAIL_ENABLED=true and configure SMTP settings to enable emails.',
      );
      this.fromAddress = null;
      return;
    }

    const fromAddress = this.getRequiredMailSetting('MAIL_FROM');
    if (!fromAddress) {
      this.logger.error(
        'MAIL_FROM is not configured; mail service will be disabled.',
      );
      this.mailEnabled = false;
      this.fromAddress = null;
      return;
    }

    this.fromAddress = fromAddress;
  }

  async onModuleInit() {
    if (!this.mailEnabled) {
      return;
    }

    try {
      await this.initializeTransporter();
      this.mailReady = true;
      this.logger.log('SMTP transporter verified successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to initialize SMTP transporter. Emails will not be delivered.',
        error instanceof Error ? error.stack : String(error),
      );
      this.mailReady = false;
      this.mailEnabled = false;
      this.transporter = null;
      this.logger.warn(
        'Mail service disabled due to SMTP verification failure.',
      );
    }
  }

  get enabled() {
    return this.mailEnabled && this.mailReady;
  }

  private getEnv<Key extends keyof EnvVars>(
    key: Key,
  ): EnvVars[Key] | undefined {
    return this.config.get(key, { infer: true });
  }

  private getRequiredMailSetting<Key extends keyof EnvVars>(
    key: Key,
  ): NonNullable<EnvVars[Key]> | null {
    const value = this.getEnv(key);
    if (value === undefined || value === null || value === '') {
      this.logger.error(
        `Missing required environment variable for mail service: ${String(key)}`,
      );
      return null;
    }
    return value as NonNullable<EnvVars[Key]>;
  }

  private async initializeTransporter() {
    const host = this.getRequiredMailSetting('SMTP_HOST');
    const port = this.getRequiredMailSetting('SMTP_PORT');
    const secure = Boolean(this.getEnv('SMTP_SECURE'));
    const user = this.getRequiredMailSetting('SMTP_USERNAME');
    const pass = this.getRequiredMailSetting('SMTP_PASSWORD');

    if (host === null || port === null || user === null || pass === null) {
      throw new Error('SMTP configuration is incomplete.');
    }

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await this.transporter.verify();
  }

  async sendMail(options: MailPayload) {
    if (!this.mailEnabled || !this.mailReady || !this.fromAddress) {
      this.logger.debug('Mail disabled. Skipping sendMail call.');
      return;
    }
    if (!this.transporter) {
      this.logger.warn(
        'Mail transporter is not initialized; skipping email send.',
      );
      return;
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
    if (!this.enabled) {
      return;
    }
    const subject = 'Miaow Hotel ekibinden merhaba';
    const salutation = name ? `Merhaba ${name},` : 'Merhaba,';
            const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <p>${salutation}</p>
          <p>Hesabýn için yeni bir þifre belirlemek üzere aþaðýdaki baðlantýyý kullanabilirsin. Baðlantý kýsa süre sonra geçersiz olacaktýr.</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color:#ffb673;color:#1f2933;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Yeni þifre belirle</a>
          </p>
          <p>Eðer bu isteði sen gerçekleþtirmediysen bu e-postayý yok sayabilirsin.</p>
          <p>Sevgiler,<br/>Miaow Hotel Ekibi</p>
        </body>
      </html>
    `;

    await this.sendMail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, link: string, name?: string) {
    if (!this.enabled) {
      return;
    }
    const salutation = name ? `Merhaba ${name},` : 'Merhaba,';
    const subject = 'Catotel ÅŸifre yenileme baÄŸlantÄ±sÄ±';
            const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <p>${salutation}</p>
          <p>Hesabýn için yeni bir þifre belirlemek üzere aþaðýdaki baðlantýyý kullanabilirsin. Baðlantý kýsa süre sonra geçersiz olacaktýr.</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color:#ffb673;color:#1f2933;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Yeni þifre belirle</a>
          </p>
          <p>Eðer bu isteði sen gerçekleþtirmediysen bu e-postayý yok sayabilirsin.</p>
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
