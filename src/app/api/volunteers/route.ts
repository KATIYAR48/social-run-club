import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import VolunteerApplication from "@/models/Volunteer";
import User from "@/models/User";
import { emailService } from "@/lib/email-service";
import { EmailTemplates } from "@/lib/email-templates";

export async function GET() {
  try {
    await dbConnect();

    // Check authentication
    const authCookie = (cookies() as any).get("cloka_auth"); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!authCookie?.value) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authCookie.value;

    // Find user's volunteer applications
    const applications = await VolunteerApplication.find({ userId })
      .sort({ createdAt: -1 })
      .populate(
        "userId",
        "name email phone dateOfBirth gender instagramUsername"
      );

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error fetching volunteer applications:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authCookie = (cookies() as any).get("cloka_auth"); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!authCookie?.value) {
      return NextResponse.json(
        { success: false, message: "Please sign in to apply as a volunteer" },
        { status: 401 }
      );
    }

    const userId = authCookie.value;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has a pending application
    const existingApplication = await VolunteerApplication.findOne({
      userId,
      status: "pending",
    });

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending volunteer application",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      availability,
      interests,
      experience,
      motivation,
      skills,
      languages,
      additionalInfo,
      location,
    } = body;

    // Validate required fields
    if (
      !availability ||
      !interests ||
      !experience ||
      !motivation ||
      !location
    ) {
      return NextResponse.json(
        { success: false, message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Calculate age from dateOfBirth if available
    const calculateAge = (dateOfBirth: Date) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    };

    // Create new volunteer application
    const application = await VolunteerApplication.create({
      userId,
      availability,
      interests,
      experience,
      motivation,
      location,
      skills,
      languages,
      additionalInfo,
      status: "pending",
    });

    // Only send email if email service is configured
    if (emailService.isEmailConfigured()) {
      const userAge = user.dateOfBirth
        ? calculateAge(user.dateOfBirth)
        : undefined;

      const emailTemplate = EmailTemplates.volunteerApplication({
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: userAge,
          gender: user.gender,
          instagramUsername: user.instagramUsername,
        },
        location,
        availability,
        interests,
        experience,
        motivation,
        skills,
        languages,
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
        "Email service not configured. Volunteer application email not sent."
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your volunteer application has been submitted successfully",
      application: {
        _id: application._id,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Error in volunteer application:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during submission" },
      { status: 500 }
    );
  }
}
