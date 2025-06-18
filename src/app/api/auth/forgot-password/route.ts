import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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

    // Only send email if SendGrid API key is configured
    if (process.env.SENDGRID_API_KEY) {
      const resetUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/auth/reset-password/${token}`;

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@cloka.app",
        subject: "Reset Your Password",
        text: `To reset your password, click on this link: ${resetUrl}`,
        html: `
          <p>Hello,</p>
          <p>You requested to reset your password.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      await sgMail.send(msg);
    } else {
      console.warn(
        "SendGrid API key not configured. Password reset email not sent."
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
