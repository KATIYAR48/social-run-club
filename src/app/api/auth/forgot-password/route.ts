import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import crypto from "crypto";
import { emailService } from "@/lib/email-service";
import { EmailTemplates } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, we still return success even if the email doesn't exist
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link",
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token to database
    await PasswordResetToken.create({
      userId: user._id,
      token: token,
    });

    // Only send email if email service is configured
    if (emailService.isEmailConfigured()) {
      const resetUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/auth/reset-password/${token}`;

      const emailTemplate = EmailTemplates.passwordReset({
        email,
        resetUrl,
      });

      const msg = {
        to: email,
        from: process.env.SES_FROM_EMAIL || "admin@cloka.in",
        ...emailTemplate,
      };

      await emailService.sendEmail(msg);
    } else {
      console.warn(
        "Email service not configured. Password reset email not sent."
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    );
  }
}
