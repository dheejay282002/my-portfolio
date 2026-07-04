import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { signToken } from "@/lib/auth";

async function getSettings() {
  const row = await queryOne(
    "SELECT google_client_id, google_client_secret, github_client_id, github_client_secret FROM web_settings WHERE id = 1"
  );
  return row as {
    google_client_id: string;
    google_client_secret: string;
    github_client_id: string;
    github_client_secret: string;
  } | null;
}

async function getGoogleUser(code: string) {
  const settings = await getSettings();
  const clientId = settings?.google_client_id || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = settings?.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || "";

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/oauth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch Google user info");
  return await userRes.json();
}

async function getGitHubUser(code: string) {
  const settings = await getSettings();
  const clientId = settings?.github_client_id || process.env.GITHUB_CLIENT_ID || "";
  const clientSecret = settings?.github_client_secret || process.env.GITHUB_CLIENT_SECRET || "";

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`GitHub token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();
  if (tokens.error) throw new Error(`GitHub OAuth error: ${tokens.error_description || tokens.error}`);

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch GitHub user info");
  const userData = await userRes.json();

  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!emailRes.ok) throw new Error("Failed to fetch GitHub emails");
  const emails = await emailRes.json();

  const primary = emails.find((e: any) => e.primary && e.verified);
  return {
    id: String(userData.id),
    email: primary?.email || userData.email,
    name: userData.name || userData.login,
    avatar_url: userData.avatar_url,
  };
}

const PROVIDER_HANDLERS: Record<string, (code: string) => Promise<{ id: string; email: string; name: string; avatar_url?: string }>> = {
  google: getGoogleUser,
  github: getGitHubUser,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const handler = PROVIDER_HANDLERS[provider];
    if (!handler) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth_denied", req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
    }

    const oauthUser = await handler(code);

    if (!oauthUser.email) {
      return NextResponse.redirect(new URL("/login?error=no_email", req.url));
    }

    await execute(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50)
    `);
    await execute(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255)
    `);
    await execute(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT
    `);

    const existing = await queryOne(
      "SELECT id, name, email, role FROM users WHERE email = $1",
      [oauthUser.email]
    ) as { id: number; name: string; email: string; role: "admin" | "client" } | null;

    let user: { id: number; name: string; email: string; role: "admin" | "client" };

    if (existing) {
      await execute(
        "UPDATE users SET oauth_provider = $1, oauth_id = $2, avatar_url = COALESCE(avatar_url, $3) WHERE id = $4",
        [provider, oauthUser.id, oauthUser.avatar_url || null, existing.id]
      );
      user = existing;
    } else {
      const result = await queryOne(
        `INSERT INTO users (name, email, password, role, oauth_provider, oauth_id, avatar_url)
         VALUES ($1, $2, $3, 'client', $4, $5, $6) RETURNING id`,
        [oauthUser.name || oauthUser.email.split("@")[0], oauthUser.email, null, provider, oauthUser.id, oauthUser.avatar_url || null]
      ) as { id: number };
      user = { id: result.id, name: oauthUser.name || oauthUser.email.split("@")[0], email: oauthUser.email, role: "client" };
    }

    const token = signToken(user);
    const dashboardUrl = new URL(
      user.role === "admin" ? "/dashboard/admin" : "/dashboard/client",
      req.url
    );

    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(`[OAUTH CALLBACK ERROR]`, err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}
