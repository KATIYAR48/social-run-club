import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "User ID required" }, { status: 400 });
  }

  const stravaAuthUrl =
    `https://www.strava.com/oauth/authorize?` +
    `client_id=${process.env.STRAVA_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(
      process.env.NEXTAUTH_URL + "/api/auth/strava/callback"
    )}&` +
    `approval_prompt=force&` +
    `scope=read,activity:read_all,profile:read_all&` +
    `state=${userId}`;

  return NextResponse.redirect(stravaAuthUrl);
}
