import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'dev@ethereal.email',
          pass: 'devpass',
        },
      });
      this.logger.warn(
        '⚠️ SMTP credentials not fully configured in .env. Emails will be logged to console in dev mode.',
      );
    }
  }

  async sendProjectInvitation(params: {
    to: string;
    inviterName: string;
    projectName: string;
    role: string;
    inviteUrl: string;
  }) {
    const { to, inviterName, projectName, role, inviteUrl } = params;

    const from = process.env.SMTP_FROM || 'TaskFlow <no-reply@taskflow.app>';
    const subject = `You've been invited to join ${projectName} on TaskFlow`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #4F46E5;">TaskFlow Workspace Invitation</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join the <strong>${projectName}</strong> project as a <strong>${role}</strong>.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This invitation will expire in 7 days. If you did not expect this invitation, you can ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Or paste this link into your browser: <br/><a href="${inviteUrl}">${inviteUrl}</a></p>
      </div>
    `;

    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        this.logger.log(`📧 Invitation email sent to ${to}`);
      } else {
        this.logger.log(
          `📧 [DEV MOCK EMAIL] To: ${to} | Subject: ${subject} | Invite URL: ${inviteUrl}`,
        );
      }
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(
        `❌ Failed to send invitation email to ${to}: ${errMessage}`,
      );
    }
  }
}
