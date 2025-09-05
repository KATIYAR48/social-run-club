import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import VolunteerApplication from "@/models/Volunteer";
import User from "@/models/User";
import { emailService } from "@/lib/email-service";
import { EmailTemplates } from "@/lib/email-templates";

interface PopulatedUser {
  name: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Check if user is authenticated as admin
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("cloka_auth");

    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get user and check if admin
    const user = await User.findById(authCookie.value);
    if (!user || (user.role !== "admin" && user.role !== "super-admin")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { applicationId, status } = body;

    if (
      !applicationId ||
      !status ||
      !["approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request parameters" },
        { status: 400 }
      );
    }

    // Find and update the application
    const application = await VolunteerApplication.findById(
      applicationId
    ).populate("userId", "name email");

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    application.status = status;
    await application.save();

    // Send email notification if email service is configured
    if (emailService.isEmailConfigured()) {
      const applicant = application.userId as PopulatedUser;
      const emailTemplate = EmailTemplates.volunteerStatusUpdate({
        name: applicant.name,
        status: status as "approved" | "rejected",
      });

      const msg = {
        to: applicant.email,
        from: process.env.SES_FROM_EMAIL || "admin@cloka.in",
        ...emailTemplate,
      };

      await emailService.sendEmail(msg);
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application: {
        _id: application._id,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Error in update volunteer application status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
