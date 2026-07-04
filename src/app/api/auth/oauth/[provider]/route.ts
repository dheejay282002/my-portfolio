import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";

async function getClientId(provider: string): Promise<string> {
  try {
    await execute(`
      ALTER TABLE web_settings
      ADD COLUMN IF NOT EXISTS google_client_id TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS github_client_id TEXT DEFAULT '';
    `);
    const row = await queryOne(
      provider === "google"
        ? "SELECT google_client_id FROM web_settings WHERE id = 1"
        : "SELECT github_client_id FROM web_settings WHERE id = 1"
    ) as any;
    if (row) return row[`${provider}_client_id`] || "";
  } catch {}
  return process.env[`${provider.toUpperCase()}_CLIENT_ID`] || "";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

    const clientId = await getClientId(provider);

    if (!clientId) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${provider}_not_configured`
      );
    }

    const configs: Record<string, { authUrl: string; params: Record<string, string> }> = {
      google: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          client_id: clientId,
          redirect_uri: `${baseUrl}/api/auth/oauth/google/callback`,
          response_type: "code",
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
      github: {
        authUrl: "https://github.com/login/oauth/authorize",
        params: {
          client_id: clientId,
          redirect_uri: `${baseUrl}/api/auth/oauth/github/callback`,
          scope: "read:user user:email",
        },
      },
    };

    const config = configs[provider];
    if (!config) {
      return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
    }

    const url = new URL(config.authUrl);
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return NextResponse.redirect(url.toString());
  } catch {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`);
  }
}
