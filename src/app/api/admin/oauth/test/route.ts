import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { provider } = await req.json();
    if (!provider || !["google", "github"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const settings = await queryOne(
      "SELECT google_client_id, google_client_secret, github_client_id, github_client_secret FROM web_settings WHERE id = 1"
    ) as any;

    if (!settings) {
      return NextResponse.json({ valid: false, message: "No OAuth settings found in database." });
    }

    let clientId: string;
    let clientSecret: string;

    if (provider === "google") {
      clientId = settings.google_client_id || process.env.GOOGLE_CLIENT_ID || "";
      clientSecret = settings.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || "";
    } else {
      clientId = settings.github_client_id || process.env.GITHUB_CLIENT_ID || "";
      clientSecret = settings.github_client_secret || process.env.GITHUB_CLIENT_SECRET || "";
    }

    if (!clientId) {
      return NextResponse.json({ valid: false, message: `Client ID is empty.` });
    }
    if (!clientSecret) {
      return NextResponse.json({ valid: false, message: `Client Secret is empty.` });
    }

    if (provider === "google") {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: "TEST_INVALID_CODE",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/oauth/google/callback`,
          grant_type: "authorization_code",
        }),
      });

      const data = await res.json();
      if (data.error === "invalid_grant") {
        return NextResponse.json({ valid: true, message: "Google credentials are valid." });
      } else if (data.error === "invalid_client") {
        return NextResponse.json({ valid: false, message: "Invalid Google Client ID or Secret. Check your credentials." });
      } else {
        return NextResponse.json({ valid: false, message: `Unexpected error: ${data.error || "unknown"}` });
      }
    }

    if (provider === "github") {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: "TEST_INVALID_CODE",
        }),
      });

      const data = await res.json();

      if (data.error_description?.includes("The code passed is incorrect") || data.error === "bad_verification_code") {
        return NextResponse.json({ valid: true, message: "GitHub credentials are valid." });
      } else if (data.error_description?.includes("client_id") || data.error === "incorrect_client_credentials") {
        return NextResponse.json({ valid: false, message: "Invalid GitHub Client ID or Secret. Check your credentials." });
      } else if (data.error) {
        return NextResponse.json({ valid: false, message: `Unexpected error: ${data.error_description || data.error}` });
      }

      return NextResponse.json({ valid: true, message: "GitHub credentials are valid." });
    }

    return NextResponse.json({ valid: false, message: "Unknown provider." });
  } catch (err: any) {
    console.error("[OAUTH TEST ERROR]", err);
    return NextResponse.json({ valid: false, message: err.message || "Connection failed." });
  }
}
