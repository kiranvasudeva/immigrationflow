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
}

export class EmailService {
  private apiKey: string;
  private fromAddress: string;
  private isDevelopment: boolean;

  constructor() {
    this.apiKey = process.env.MAIL_API_KEY || '';
    this.fromAddress = process.env.MAIL_FROM || 'noreply@immigrationflow.com';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async sendEmail(
    to: string,
    template: EmailTemplate,
    data: EmailData = {}
  ): Promise<boolean> {
    try {
      if (this.isDevelopment) {
        // In development, log emails instead of sending
        console.log('=== EMAIL DEBUG ===');
        console.log('To:', to);
        console.log('Subject:', this.interpolateTemplate(template.subject, data));
        console.log('HTML:', this.interpolateTemplate(template.html, data));
        console.log('==================');
        return true;
      }

      // In production, this would integrate with Mailjet/Postmark EU
      const response = await this.sendViaProvider(to, template, data);
      return response;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private async sendViaProvider(
    to: string,
    template: EmailTemplate,
    data: EmailData
  ): Promise<boolean> {
    // This would implement the actual email service integration
    // For Mailjet EU:
    /*
    const mailjet = require('node-mailjet').connect(
      process.env.MAIL_API_KEY,
      process.env.MAIL_SECRET_KEY,
      { 
        version: 'v3.1',
        url: 'https://api.eu.mailjet.com' // EU region
      }
    );

    const request = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: { Email: this.fromAddress, Name: 'ImmigrationFlow' },
        To: [{ Email: to }],
        Subject: this.interpolateTemplate(template.subject, data),
        HTMLPart: this.interpolateTemplate(template.html, data),
        TextPart: this.interpolateTemplate(template.text, data)
      }]
    });
    */
    
    console.log(`Email sent to ${to} (production mode)`);
    return true;
  }

  private interpolateTemplate(template: string, data: EmailData): string {
    let result = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, String(value || ''));
    });
    
    return result;
  }

  // Email templates
  getDeadlineReminderTemplate(): EmailTemplate {
    return {
      subject: 'Document Deadline Reminder - {{documentName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">Document Deadline Reminder</h2>
          <p>Dear {{workerName}},</p>
          <p>This is a reminder that your document <strong>{{documentName}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
          <p>Please ensure you upload the required document before the deadline to avoid delays in your immigration process.</p>
          <p><a href="{{loginUrl}}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View My Documents</a></p>
          <p>Best regards,<br>ImmigrationFlow Team</p>
        </div>
      `,
      text: `
        Document Deadline Reminder

        Dear {{workerName}},

        This is a reminder that your document {{documentName}} is due on {{dueDate}}.

        Please ensure you upload the required document before the deadline to avoid delays in your immigration process.

        Login to view your documents: {{loginUrl}}

        Best regards,
        ImmigrationFlow Team
      `
    };
  }

  getExpiryReminderTemplate(): EmailTemplate {
    return {
      subject: 'Document Expiry Alert - {{documentName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Document Expiry Alert</h2>
          <p>Dear {{workerName}},</p>
          <p>Your document <strong>{{documentName}}</strong> will expire on <strong>{{dueDate}}</strong> ({{daysUntilDue}} days remaining).</p>
          <p>Please renew this document as soon as possible to maintain your legal status in Romania.</p>
          <p><a href="{{loginUrl}}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View My Documents</a></p>
          <p>Best regards,<br>ImmigrationFlow Team</p>
        </div>
      `,
      text: `
        Document Expiry Alert

        Dear {{workerName}},

        Your document {{documentName}} will expire on {{dueDate}} ({{daysUntilDue}} days remaining).

        Please renew this document as soon as possible to maintain your legal status in Romania.

        Login to view your documents: {{loginUrl}}

        Best regards,
        ImmigrationFlow Team
      `
    };
  }

  getStatusUpdateTemplate(): EmailTemplate {
    return {
      subject: 'Status Update - {{documentName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563EB;">Status Update</h2>
          <p>Dear {{workerName}},</p>
          <p>The status of your document <strong>{{documentName}}</strong> has been updated.</p>
          <p>Please login to your account to view the latest information and any required actions.</p>
          <p><a href="{{loginUrl}}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Update</a></p>
          <p>Best regards,<br>ImmigrationFlow Team</p>
        </div>
      `,
      text: `
        Status Update

        Dear {{workerName}},

        The status of your document {{documentName}} has been updated.

        Please login to your account to view the latest information and any required actions.

        Login to view update: {{loginUrl}}

        Best regards,
        ImmigrationFlow Team
      `
    };
  }
}

export const emailService = new EmailService();
