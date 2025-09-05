import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface EmailMessage {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean;

  private constructor() {
    this.isConfigured = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION
    );
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.isConfigured) {
      console.warn("AWS SES not configured. Email not sent.");
      throw new Error("Email service not configured");
    }

    try {
      // Ensure 'to' is an array
      const recipients = Array.isArray(message.to) ? message.to : [message.to];

      const command = new SendEmailCommand({
        Source: message.from,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: "UTF-8",
          },
          Body: {
            ...(message.text && {
              Text: {
                Data: message.text,
                Charset: "UTF-8",
              },
            }),
            ...(message.html && {
              Html: {
                Data: message.html,
                Charset: "UTF-8",
              },
            }),
          },
        },
      });

      await sesClient.send(command);
      console.log(`Email sent successfully to: ${recipients.join(", ")}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  public isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
