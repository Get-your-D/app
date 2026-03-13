import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export interface EmailPayload {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    replyTo?: string;
}

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);
    private readonly smtpHost: string;
    private readonly smtpPort: number;
    private readonly smtpUser: string;
    private readonly smtpPassword: string;
    private readonly smtpFrom: string;

    constructor(private configService: ConfigService) {
        this.smtpHost = this.configService.get('SMTP_HOST', 'localhost');
        this.smtpPort = this.configService.get('SMTP_PORT', 587);
        this.smtpUser = this.configService.get('SMTP_USER', '');
        this.smtpPassword = this.configService.get('SMTP_PASSWORD', '');
        this.smtpFrom = this.configService.get('SMTP_FROM', 'noreply@healthcare.com');

        this.initializeTransporter();
    }

    private initializeTransporter(): void {
        const config: nodemailer.TransportOptions =
            this.smtpHost === 'ses'
                ? {
                    service: 'SES',
                    region: this.configService.get('AWS_REGION', 'eu-west-1'),
                }
                : {
                    host: this.smtpHost,
                    port: this.smtpPort,
                    secure: this.smtpPort === 465,
                    auth:
                        this.smtpUser && this.smtpPassword
                            ? {
                                user: this.smtpUser,
                                pass: this.smtpPassword,
                            }
                            : undefined,
                };

        this.transporter = nodemailer.createTransport(config);
    }

    async sendEmail(payload: EmailPayload): Promise<boolean> {
        try {
            const mailOptions = {
                from: this.smtpFrom,
                to: payload.to,
                subject: payload.subject,
                html: payload.htmlContent,
                text: payload.textContent || this.stripHtml(payload.htmlContent),
                replyTo: payload.replyTo || this.configService.get('DPO_EMAIL'),
            };

            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent to ${payload.to}: ${result.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${payload.to}: ${error.message}`);
            return false;
        }
    }

    async sendPasswordResetEmail(
        email: string,
        resetToken: string,
        expiresInHours: number = 24,
    ): Promise<boolean> {
        const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${resetToken}`;

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in ${expiresInHours} hours.</p>
        <p>If you didn't request this, please ignore this email or contact our support team.</p>
        <hr />
        <p><small>Unsubscribe: If you no longer wish to receive emails, please reply with "UNSUBSCRIBE".</small></p>
      </div>
    `;

        return this.sendEmail({
            to: email,
            subject: 'Password Reset Request - Healthcare Platform',
            htmlContent,
            textContent: `Password Reset: ${resetUrl}. This link expires in ${expiresInHours} hours.`,
        });
    }

    async sendAppointmentConfirmationEmail(
        email: string,
        appointmentData: {
            patientName: string;
            providerName: string;
            appointmentDate: Date;
            type: 'telemedicine' | 'in-person';
            location?: string;
            meetingUrl?: string;
        },
    ): Promise<boolean> {
        const dateStr = appointmentData.appointmentDate.toLocaleString('de-DE');
        const locationInfo =
            appointmentData.type === 'telemedicine'
                ? `<p>Meeting Link: <a href="${appointmentData.meetingUrl}">${appointmentData.meetingUrl}</a></p>`
                : `<p>Location: ${appointmentData.location || 'To be confirmed'}</p>`;

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Confirmation</h2>
        <p>Dear ${appointmentData.patientName},</p>
        <p>Your appointment with ${appointmentData.providerName} has been confirmed:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Date & Time:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Type:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${appointmentData.type}</td>
          </tr>
          ${appointmentData.type === 'telemedicine' ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Meeting URL:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              <a href="${appointmentData.meetingUrl}">${appointmentData.meetingUrl}</a>
            </td>
          </tr>
          ` : ''}
        </table>
        <p>Please arrive 10 minutes early for in-person appointments.</p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <hr />
        <p><small>This is a GDPR-compliant healthcare appointment confirmation. Data is encrypted and retained per regulations.</small></p>
      </div>
    `;

        return this.sendEmail({
            to: email,
            subject: `Appointment Confirmation - ${dateStr}`,
            htmlContent,
        });
    }

    async sendAppointmentReminderEmail(
        email: string,
        appointmentData: {
            patientName: string;
            providerName: string;
            appointmentDate: Date;
            type: 'telemedicine' | 'in-person';
            meetingUrl?: string;
        },
    ): Promise<boolean> {
        const dateStr = appointmentData.appointmentDate.toLocaleString('de-DE');
        const meetingInfo =
            appointmentData.type === 'telemedicine'
                ? `<p>Meeting Link: <a href="${appointmentData.meetingUrl}">${appointmentData.meetingUrl}</a></p>`
                : '';

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Reminder</h2>
        <p>Dear ${appointmentData.patientName},</p>
        <p>This is a reminder of your upcoming appointment in 24 hours:</p>
        <p><strong>${dateStr}</strong> with ${appointmentData.providerName}</p>
        ${meetingInfo}
        <p>If you need to reschedule, please contact us as soon as possible.</p>
      </div>
    `;

        return this.sendEmail({
            to: email,
            subject: 'Appointment Reminder - 24 Hours',
            htmlContent,
        });
    }

    async sendBreachNotificationEmail(
        email: string,
        breachData: {
            incidentType: string;
            affectedDataTypes: string[];
            discoveryDate: Date;
            estimatedAffectedCount: number;
            dpoEmail: string;
            remediationSteps: string[];
        },
    ): Promise<boolean> {
        const affectedList = breachData.affectedDataTypes.join(', ');

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid red; padding: 20px;">
        <h2 style="color: red;">Security Incident Notification</h2>
        <p>We are writing to inform you of a security incident that may affect your personal data.</p>
        
        <h3>Incident Details:</h3>
        <ul>
          <li><strong>Type:</strong> ${breachData.incidentType}</li>
          <li><strong>Affected Data:</strong> ${affectedList}</li>
          <li><strong>Discovery Date:</strong> ${breachData.discoveryDate.toLocaleDateString('de-DE')}</li>
          <li><strong>Estimated Affected Records:</strong> ${breachData.estimatedAffectedCount}</li>
        </ul>

        <h3>What We're Doing:</h3>
        <ol>
          ${breachData.remediationSteps.map((step) => `<li>${step}</li>`).join('')}
        </ol>

        <h3>What You Should Do:</h3>
        <ul>
          <li>Monitor your account for suspicious activity</li>
          <li>Change your password immediately</li>
          <li>Contact our Data Protection Officer if you have concerns</li>
        </ul>

        <h3>Contact Information:</h3>
        <p>Data Protection Officer: <a href="mailto:${breachData.dpoEmail}">${breachData.dpoEmail}</a></p>
        
        <p>For more information, visit our Data Privacy page or contact our support team.</p>
        
        <hr />
        <p><small>This notification is required under GDPR Article 34. Your data security is our priority.</small></p>
      </div>
    `;

        return this.sendEmail({
            to: email,
            subject: 'URGENT: Security Incident Notification',
            htmlContent,
            replyTo: breachData.dpoEmail,
        });
    }

    async sendGDPRDataExportEmail(
        email: string,
        exportData: {
            userName: string;
            exportDate: Date;
            downloadUrl: string;
            expiresInDays: number;
        },
    ): Promise<boolean> {
        const expiryDate = new Date(exportData.exportDate);
        expiryDate.setDate(expiryDate.getDate() + exportData.expiresInDays);

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Data Export is Ready</h2>
        <p>Dear ${exportData.userName},</p>
        <p>Your GDPR data export request has been processed. Your personal data is ready for download:</p>
        <p>
          <a href="${exportData.downloadUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
            Download Your Data
          </a>
        </p>
        <p><small>Download link expires on ${expiryDate.toLocaleDateString('de-DE')}.</small></p>
        <p>This file contains all your personal data in a portable format (CSV/JSON).</p>
        <p>If you did not request this export, please contact us immediately.</p>
      </div>
    `;

        return this.sendEmail({
            to: email,
            subject: 'Your Personal Data Export - GDPR Request',
            htmlContent,
        });
    }

    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&#?\w+;/g, '');
    }
}
