import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Partnership from "@/models/Partnership";
import { emailService } from "@/lib/email-service";
import { EmailTemplates } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      organizationName,
      email,
      phone,
      links,
      cities,
      description,
      collaborationType,
      pastCollaboration,
      collaborationReason,
      additionalInfo,
    } = body;

    // Validate required fields
    if (
      !name ||
      !organizationName ||
      !email ||
      !phone ||
      !links ||
      !cities ||
      !description ||
      !collaborationType
    ) {
      return NextResponse.json(
        { success: false, message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Create new partnership inquiry
    const partnership = await Partnership.create({
      name,
      organizationName,
      email,
      phone,
      links,
      cities,
      description,
      collaborationType,
      pastCollaboration,
      collaborationReason,
      additionalInfo,
    });

    // Only send email if email service is configured
    if (emailService.isEmailConfigured()) {
      const emailTemplate = EmailTemplates.partnershipInquiry({
        name,
        organizationName,
        email,
        phone,
        links,
        cities,
        description,
        collaborationType,
        pastCollaboration,
        collaborationReason,
        additionalInfo,
      });

      const msg = {
        to: "support@cloka.in",
        from: process.env.SES_FROM_EMAIL || "admin@cloka.in",
        ...emailTemplate,
      };

      await emailService.sendEmail(msg);
    } else {
      console.warn(
        "Email service not configured. Partnership inquiry email not sent."
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your partnership inquiry has been submitted successfully",
      partnership: {
        _id: partnership._id,
        name: partnership.name,
        email: partnership.email,
      },
    });
  } catch (error) {
    console.error("Error in partnership inquiry:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during submission" },
      { status: 500 }
    );
  }
}
