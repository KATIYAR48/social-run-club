import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WaitlistEntry from "@/models/WaitlistEntry";
import User from "@/models/User";
import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const authCookie = request.cookies.get("cloka_auth");

    // Check if user is authenticated
    if (!authCookie?.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required to join waitlist" },
        { status: 401 }
      );
    }

    // Get user data
    const user = await User.findById(authCookie.value);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { preferredMerch, size, colorPreference, additionalInfo } = body;

    // Validate required fields
    if (!preferredMerch) {
      return NextResponse.json(
        { success: false, message: "Preferred merch is required" },
        { status: 400 }
      );
    }

    await WaitlistEntry.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredMerch,
      size,
      colorPreference,
      instagramUsername: user.instagramUsername || "",
      additionalInfo,
      status: "waiting",
    });

    // Send confirmation email to user
    if (process.env.SENDGRID_API_KEY) {
      const userMsg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@cloka.app",
        subject: "Cloka Merch Waitlist Confirmation",
        text: `Hi ${user.name},\n\nThank you for joining the Cloka merch waitlist! We'll notify you as soon as our merch is available.\n\n- Team Cloka`,
        html: `<p>Hi ${user.name},</p><p>Thank you for joining the <b>Cloka merch waitlist</b>!<br/>We'll notify you as soon as our merch is available.</p><p>- Team Cloka</p>`,
      };
      await sgMail.send(userMsg);

      // Send notification to support
      const supportMsg = {
        to: "support@cloka.in",
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@cloka.app",
        subject: `New Merch Waitlist Entry - ${user.name}`,
        text: `Name: ${user.name}\nEmail: ${user.email}\nPhone: ${
          user.phone
        }\nPreferred Merch: ${preferredMerch}\n${
          size ? `Size: ${size}` : ""
        }\n${colorPreference ? `Color: ${colorPreference}` : ""}\n${
          user.instagramUsername ? `Instagram: ${user.instagramUsername}` : ""
        }\n${
          additionalInfo ? `Additional Info: ${additionalInfo}` : ""
        }\nUserId: ${user._id}`,
        html: `<h3>New Merch Waitlist Entry</h3><p><b>Name:</b> ${
          user.name
        }</p><p><b>Email:</b> ${user.email}</p><p><b>Phone:</b> ${
          user.phone
        }</p><p><b>Preferred Merch:</b> ${preferredMerch}</p>${
          size ? `<p><b>Size:</b> ${size}</p>` : ""
        }${colorPreference ? `<p><b>Color:</b> ${colorPreference}</p>` : ""}${
          user.instagramUsername
            ? `<p><b>Instagram:</b> ${user.instagramUsername}</p>`
            : ""
        }${
          additionalInfo
            ? `<p><b>Additional Info:</b> ${additionalInfo}</p>`
            : ""
        }`,
      };
      await sgMail.send(supportMsg);
    }

    return NextResponse.json({
      success: true,
      message: "You have been added to the merch waitlist!",
    });
  } catch (error) {
    console.error("Error in merch waitlist:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during submission" },
      { status: 500 }
    );
  }
}
