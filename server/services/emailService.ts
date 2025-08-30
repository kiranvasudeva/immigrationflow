import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  clientName?: string;
  workerName?: string;
  documentName?: string;
  dueDate?: string;
  daysUntilDue?: number;
  loginUrl?: string;
  status?: string;
  stageName?: string;
  reason?: string;
  adminMessage?: string;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean>;
}

class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@patra.ro',
        to,
        subject,
        html,
        text,
      });
      return true;
    } catch (error) {
      console.error('SMTP send error:', error);
      return false;
    }
  }
}

class ResendProvider implements EmailProvider {
  private resend: Resend;

  constructor() {
    if (!process.env.MAIL_API_KEY) {
      throw new Error('MAIL_API_KEY is required for Resend provider');
    }
    this.resend = new Resend(process.env.MAIL_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: process.env.MAIL_FROM || 'noreply@patra.ro',
        to,
        subject,
        html,
        text,
      });
      return true;
    } catch (error) {
      console.error('Resend send error:', error);
      return false;
    }
  }
}

class DevelopmentProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    console.log('=== EMAIL DEBUG ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('Text:', text);
    console.log('==================');
    return true;
  }
}

export class EmailService {
  private provider: EmailProvider;

  constructor() {
    const mailProvider = process.env.MAIL_PROVIDER || 'development';
    
    switch (mailProvider) {
      case 'smtp':
        this.provider = new SMTPProvider();
        break;
      case 'resend':
        this.provider = new ResendProvider();
        break;
      case 'development':
      default:
        this.provider = new DevelopmentProvider();
        break;
    }
  }

  async sendEmail(
    to: string,
    template: EmailTemplate,
    data: EmailData = {}
  ): Promise<boolean> {
    try {
      const subject = this.interpolateTemplate(template.subject, data);
      const html = this.interpolateTemplate(template.html, data);
      const text = this.interpolateTemplate(template.text, data);

      return await this.provider.sendEmail(to, subject, html, text);
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private interpolateTemplate(template: string, data: EmailData): string {
    let result = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, String(value || ''));
    });
    
    return result;
  }

  // Email template methods
  getUploadReminderTemplate(): EmailTemplate {
    return {
      subject: 'Reminder: Upload Required Document - {{documentName}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Document Upload Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Patra</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Romanian Immigration Services</p>
            </div>
            
            <h2 style="color: #DC2626; margin: 0 0 20px 0;">Document Upload Required</h2>
            
            <p style="margin: 0 0 15px 0;">Dear {{workerName}},</p>
            
            <p style="margin: 0 0 15px 0;">This is a reminder that you need to upload the following document:</p>
            
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #92400E;">{{documentName}}</strong>
              {{#dueDate}}
              <br><span style="color: #92400E;">Due: {{dueDate}}</span>
              {{/dueDate}}
            </div>
            
            <p style="margin: 0 0 15px 0;">Please upload this document as soon as possible to avoid delays in your Romanian immigration process.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Upload Document</a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Patra Team</strong><br>
              Romanian Immigration Specialists
            </p>
            
            <hr style="border: none; height: 1px; background-color: #e5e5e5; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        PATRA - Romanian Immigration Services
        
        Document Upload Required
        
        Dear {{workerName}},
        
        This is a reminder that you need to upload the following document:
        
        Document: {{documentName}}
        {{#dueDate}}Due Date: {{dueDate}}{{/dueDate}}
        
        Please upload this document as soon as possible to avoid delays in your Romanian immigration process.
        
        Upload your document: {{loginUrl}}
        
        Best regards,
        Patra Team
        Romanian Immigration Specialists
        
        ---
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  getStatusChangedTemplate(): EmailTemplate {
    return {
      subject: 'Status Update: {{documentName}} - {{status}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Patra</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Romanian Immigration Services</p>
            </div>
            
            <h2 style="color: #2563EB; margin: 0 0 20px 0;">Status Update</h2>
            
            <p style="margin: 0 0 15px 0;">Dear {{workerName}},</p>
            
            <p style="margin: 0 0 15px 0;">We have an update regarding your immigration process:</p>
            
            <div style="background-color: #F0F9FF; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #1E40AF;">Document:</strong> {{documentName}}<br>
              <strong style="color: #1E40AF;">New Status:</strong> {{status}}
            </div>
            
            {{#adminMessage}}
            <div style="background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #374151;">Message from Admin:</strong><br>
              <span style="color: #6B7280;">{{adminMessage}}</span>
            </div>
            {{/adminMessage}}
            
            <p style="margin: 0 0 15px 0;">Please login to your account to view the complete details and any required next steps.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Details</a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Patra Team</strong><br>
              Romanian Immigration Specialists
            </p>
            
            <hr style="border: none; height: 1px; background-color: #e5e5e5; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        PATRA - Romanian Immigration Services
        
        Status Update
        
        Dear {{workerName}},
        
        We have an update regarding your immigration process:
        
        Document: {{documentName}}
        New Status: {{status}}
        
        {{#adminMessage}}
        Message from Admin: {{adminMessage}}
        {{/adminMessage}}
        
        Please login to your account to view the complete details and any required next steps.
        
        View details: {{loginUrl}}
        
        Best regards,
        Patra Team
        Romanian Immigration Specialists
        
        ---
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  getDocumentApprovedTemplate(): EmailTemplate {
    return {
      subject: 'Document Approved: {{documentName}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Document Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Patra</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Romanian Immigration Services</p>
            </div>
            
            <h2 style="color: #059669; margin: 0 0 20px 0;">✓ Document Approved</h2>
            
            <p style="margin: 0 0 15px 0;">Dear {{workerName}},</p>
            
            <p style="margin: 0 0 15px 0;">Great news! Your document has been approved:</p>
            
            <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #065F46;">{{documentName}}</strong><br>
              <span style="color: #065F46;">✓ Approved and accepted for processing</span>
            </div>
            
            {{#adminMessage}}
            <div style="background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #374151;">Admin Notes:</strong><br>
              <span style="color: #6B7280;">{{adminMessage}}</span>
            </div>
            {{/adminMessage}}
            
            <p style="margin: 0 0 15px 0;">Your immigration process is progressing smoothly. We will keep you updated on the next steps.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Progress</a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Patra Team</strong><br>
              Romanian Immigration Specialists
            </p>
            
            <hr style="border: none; height: 1px; background-color: #e5e5e5; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        PATRA - Romanian Immigration Services
        
        Document Approved ✓
        
        Dear {{workerName}},
        
        Great news! Your document has been approved:
        
        Document: {{documentName}}
        Status: ✓ Approved and accepted for processing
        
        {{#adminMessage}}
        Admin Notes: {{adminMessage}}
        {{/adminMessage}}
        
        Your immigration process is progressing smoothly. We will keep you updated on the next steps.
        
        View your progress: {{loginUrl}}
        
        Best regards,
        Patra Team
        Romanian Immigration Specialists
        
        ---
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  getDocumentRejectedTemplate(): EmailTemplate {
    return {
      subject: 'Document Requires Attention: {{documentName}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Document Requires Attention</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Patra</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Romanian Immigration Services</p>
            </div>
            
            <h2 style="color: #DC2626; margin: 0 0 20px 0;">Document Requires Attention</h2>
            
            <p style="margin: 0 0 15px 0;">Dear {{workerName}},</p>
            
            <p style="margin: 0 0 15px 0;">Your submitted document requires some corrections before we can proceed:</p>
            
            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #991B1B;">{{documentName}}</strong><br>
              <span style="color: #991B1B;">Requires corrections</span>
            </div>
            
            {{#reason}}
            <div style="background-color: #FFF7ED; border: 1px solid #FB923C; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #EA580C;">Issues to address:</strong><br>
              <span style="color: #EA580C;">{{reason}}</span>
            </div>
            {{/reason}}
            
            {{#adminMessage}}
            <div style="background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #374151;">Additional Notes:</strong><br>
              <span style="color: #6B7280;">{{adminMessage}}</span>
            </div>
            {{/adminMessage}}
            
            <p style="margin: 0 0 15px 0;">Please review the feedback above, make the necessary corrections, and resubmit your document. Don't worry - this is a normal part of the process, and we're here to help!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Resubmit Document</a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Patra Team</strong><br>
              Romanian Immigration Specialists
            </p>
            
            <hr style="border: none; height: 1px; background-color: #e5e5e5; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        PATRA - Romanian Immigration Services
        
        Document Requires Attention
        
        Dear {{workerName}},
        
        Your submitted document requires some corrections before we can proceed:
        
        Document: {{documentName}}
        Status: Requires corrections
        
        {{#reason}}
        Issues to address: {{reason}}
        {{/reason}}
        
        {{#adminMessage}}
        Additional Notes: {{adminMessage}}
        {{/adminMessage}}
        
        Please review the feedback above, make the necessary corrections, and resubmit your document. Don't worry - this is a normal part of the process, and we're here to help!
        
        Resubmit your document: {{loginUrl}}
        
        Best regards,
        Patra Team
        Romanian Immigration Specialists
        
        ---
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  getStageMovedTemplate(): EmailTemplate {
    return {
      subject: 'Progress Update: Moved to {{stageName}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Stage Progress Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Patra</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Romanian Immigration Services</p>
            </div>
            
            <h2 style="color: #7C3AED; margin: 0 0 20px 0;">🎉 Progress Update</h2>
            
            <p style="margin: 0 0 15px 0;">Dear {{workerName}},</p>
            
            <p style="margin: 0 0 15px 0;">Congratulations! Your Romanian immigration process has progressed to the next stage:</p>
            
            <div style="background-color: #F5F3FF; border-left: 4px solid #7C3AED; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #5B21B6; font-size: 18px;">{{stageName}}</strong><br>
              <span style="color: #5B21B6;">You have successfully advanced to this new stage</span>
            </div>
            
            {{#adminMessage}}
            <div style="background-color: #F9FAFB; border: 1px solid #D1D5DB; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #374151;">What's Next:</strong><br>
              <span style="color: #6B7280;">{{adminMessage}}</span>
            </div>
            {{/adminMessage}}
            
            <p style="margin: 0 0 15px 0;">Please login to your account to see the updated requirements and timeline for this stage. Our team will continue to guide you through each step of the process.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View New Stage</a>
            </div>
            
            <div style="background-color: #EFF6FF; padding: 15px; margin: 30px 0; border-radius: 6px; border: 1px solid #BFDBFE;">
              <p style="margin: 0; color: #1E40AF; font-size: 14px;">
                <strong>💡 Tip:</strong> Each stage brings you closer to completing your Romanian immigration process. Keep up the great work!
              </p>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Patra Team</strong><br>
              Romanian Immigration Specialists
            </p>
            
            <hr style="border: none; height: 1px; background-color: #e5e5e5; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        PATRA - Romanian Immigration Services
        
        Progress Update 🎉
        
        Dear {{workerName}},
        
        Congratulations! Your Romanian immigration process has progressed to the next stage:
        
        New Stage: {{stageName}}
        Status: You have successfully advanced to this new stage
        
        {{#adminMessage}}
        What's Next: {{adminMessage}}
        {{/adminMessage}}
        
        Please login to your account to see the updated requirements and timeline for this stage. Our team will continue to guide you through each step of the process.
        
        View your new stage: {{loginUrl}}
        
        💡 Tip: Each stage brings you closer to completing your Romanian immigration process. Keep up the great work!
        
        Best regards,
        Patra Team
        Romanian Immigration Specialists
        
        ---
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  // Legacy templates for backward compatibility
  getDeadlineReminderTemplate(): EmailTemplate {
    return this.getUploadReminderTemplate();
  }

  getExpiryReminderTemplate(): EmailTemplate {
    return {
      subject: 'Document Expiry Alert - {{documentName}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Document Expiry Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">Patra</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Romanian Immigration Services</p>
            </div>
            
            <h2 style="color: #DC2626; margin: 0 0 20px 0;">⚠️ Document Expiry Alert</h2>
            
            <p style="margin: 0 0 15px 0;">Dear {{workerName}},</p>
            
            <p style="margin: 0 0 15px 0;">This is an important reminder that your document will expire soon:</p>
            
            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #991B1B;">{{documentName}}</strong><br>
              <span style="color: #991B1B;">Expires: {{dueDate}} ({{daysUntilDue}} days remaining)</span>
            </div>
            
            <p style="margin: 0 0 15px 0;"><strong>Please renew this document immediately</strong> to maintain your legal status in Romania and avoid any complications with your immigration process.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Take Action Now</a>
            </div>
            
            <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Patra Team</strong><br>
              Romanian Immigration Specialists
            </p>
            
            <hr style="border: none; height: 1px; background-color: #e5e5e5; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        PATRA - Romanian Immigration Services
        
        Document Expiry Alert ⚠️
        
        Dear {{workerName}},
        
        This is an important reminder that your document will expire soon:
        
        Document: {{documentName}}
        Expires: {{dueDate}} ({{daysUntilDue}} days remaining)
        
        Please renew this document immediately to maintain your legal status in Romania and avoid any complications with your immigration process.
        
        Take action now: {{loginUrl}}
        
        Best regards,
        Patra Team
        Romanian Immigration Specialists
        
        ---
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  getStatusUpdateTemplate(): EmailTemplate {
    return this.getStatusChangedTemplate();
  }
}

export const emailService = new EmailService();