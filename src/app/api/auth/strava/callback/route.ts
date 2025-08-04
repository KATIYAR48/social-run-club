import { NextRequest, NextResponse } from "next/server";
import User from "../../../../../models/User";
import dbConnect from "../../../../../lib/mongodb";
import { fetchAndUpdateStravaStats } from "../../../../../lib/strava";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?error=${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/profile?error=missing_parameters", request.url)
    );
  }

  try {
    await dbConnect();

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    // Get athlete profile
    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const athleteData = await athleteResponse.json();

    // Update user with Strava data
    await User.findByIdAndUpdate(
      state,
      {
        "strava.athleteId": athleteData.id.toString(),
        "strava.accessToken": tokenData.access_token,
        "strava.refreshToken": tokenData.refresh_token,
        "strava.tokenExpiresAt": new Date(tokenData.expires_at * 1000),
        "strava.connected": true,
        "strava.profile": {
          firstname: athleteData.firstname,
          lastname: athleteData.lastname,
          profile: athleteData.profile,
          city: athleteData.city,
          state: athleteData.state,
          country: athleteData.country,
          sex: athleteData.sex,
          weight: athleteData.weight,
        },
      },
      { new: true }
    );

    // Immediately fetch and store initial stats
    await fetchAndUpdateStravaStats(state);

    return NextResponse.redirect(
      new URL("/profile?strava=connected", request.url)
    );
  } catch (error) {
    console.error("Strava callback error:", error);
    return NextResponse.redirect(
      new URL("/profile?error=connection_failed", request.url)
    );
  }
}
