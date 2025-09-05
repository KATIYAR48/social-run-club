import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email-service";
import { EmailTemplates } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueType, details, contact } = body;

    // Validate input
    if (!issueType || !details) {
      return NextResponse.json(
        { success: false, message: "Issue type and details are required" },
        { status: 400 }
      );
    }

    // Only send email if email service is configured
    if (!emailService.isEmailConfigured()) {
      console.warn("Email service not configured. Contact email not sent.");
      return NextResponse.json(
        { success: false, message: "Email service not configured" },
        { status: 500 }
      );
    }

    const emailTemplate = EmailTemplates.contactFormSubmission({
      issueType,
      contact,
      details,
    });

    const msg = {
      to: "support@cloka.in",
      from: process.env.SES_FROM_EMAIL || "admin@cloka.in",
      ...emailTemplate,
    };

    await emailService.sendEmail(msg);

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully",
    });
  } catch (error) {
    console.error("Error in contact form submission:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}
