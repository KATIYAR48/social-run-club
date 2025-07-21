import { NextResponse } from "next/server";

export async function GET() {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    return NextResponse.json({
      vapidPublicKey: vapidPublicKey
        ? `${vapidPublicKey.substring(0, 10)}...`
        : "NOT_SET",
      vapidPrivateKey: vapidPrivateKey ? "SET" : "NOT_SET",
      vapidSubject: vapidSubject || "NOT_SET",
      currentDomain: process.env.VERCEL_URL || "localhost",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check VAPID configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
