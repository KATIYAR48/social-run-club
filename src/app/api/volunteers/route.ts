import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import VolunteerApplication from "@/models/Volunteer";
import User from "@/models/User";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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

    // Only send email if SendGrid API key is configured
    if (process.env.SENDGRID_API_KEY) {
      const userAge = user.dateOfBirth
        ? calculateAge(user.dateOfBirth)
        : undefined;

      const msg = {
        to: "support@cloka.in",
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@cloka.app",
        subject: `New Volunteer Application - ${user.name}`,
        text: `
Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone}
Age: ${userAge || "Not specified"}
Gender: ${user.gender || "Not specified"}
Instagram: ${user.instagramUsername || "Not specified"}

Application Details:
Location: ${location}
Availability: ${availability}
Interests: ${interests}
Experience: ${experience}
Motivation: ${motivation}
${skills ? `Skills: ${skills}` : ""}
${languages ? `Languages: ${languages}` : ""}
${additionalInfo ? `Additional Info: ${additionalInfo}` : ""}
        `,
        html: `
          <h3>New Volunteer Application</h3>
          <h4>User Details:</h4>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${user.phone}</p>
          <p><strong>Age:</strong> ${userAge || "Not specified"}</p>
          <p><strong>Gender:</strong> ${user.gender || "Not specified"}</p>
          <p><strong>Instagram:</strong> ${
            user.instagramUsername || "Not specified"
          }</p>

          <h4>Application Details:</h4>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Availability:</strong> ${availability}</p>
          <p><strong>Interests:</strong> ${interests}</p>
          <p><strong>Experience:</strong> ${experience}</p>
          <p><strong>Motivation:</strong> ${motivation}</p>
          ${skills ? `<p><strong>Skills:</strong> ${skills}</p>` : ""}
          ${languages ? `<p><strong>Languages:</strong> ${languages}</p>` : ""}
          ${
            additionalInfo
              ? `<p><strong>Additional Info:</strong> ${additionalInfo}</p>`
              : ""
          }
        `,
      };

      await sgMail.send(msg);
    } else {
      console.warn(
        "SendGrid API key not configured. Volunteer application email not sent."
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
