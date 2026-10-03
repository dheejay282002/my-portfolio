import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getBaseUrl } from "@/lib/base-url";

type OAuthSettings = {
  google_client_id?: string;
  google_client_secret?: string;
  github_client_id?: string;
  github_client_secret?: string;
};

type OAuthErrorBody = {
  error?: string;
  error_description?: string;
};

type AuthorizeProbe = {
  ok: boolean;
  error: string;
  description: string;
};

function emptyErrorBody(): OAuthErrorBody {
  return {};
}

function cleanDescription(value?: string): string {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function result(valid: boolean, message: string) {
  return NextResponse.json({ valid, message });
}

async function probeGoogleAuthorize(clientId: string, redirectUri: string): Promise<AuthorizeProbe> {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");

  const res = await fetch(url.toString(), { redirect: "manual" });
  const location = res.headers.get("location") || "";

  if (!location.includes("/signin/oauth/error") && !location.includes("authError=")) {
    return { ok: true, error: "", description: "" };
  }

  const encoded = new URL(location).searchParams.get("authError") || "";
  const parts = Buffer.from(encoded, "base64")
    .toString("latin1")
    .split(/[^\x20-\x7E]+/)
    .filter(Boolean);

  return {
    ok: false,
    error: parts[0] || "unknown",
    description: (parts[1] || "").trim(),
  };
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { provider } = await req.json();
    if (!provider || !["google", "github"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const settings = (await queryOne(
      "SELECT google_client_id, google_client_secret, github_client_id, github_client_secret FROM web_settings WHERE id = 1"
    )) as OAuthSettings | null;

    if (!settings) {
      return result(false, "No OAuth settings found in database.");
    }

    let clientId: string;
    let clientSecret: string;

    if (provider === "google") {
      clientId = (settings.google_client_id || process.env.GOOGLE_CLIENT_ID || "").trim();
      clientSecret = (settings.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || "").trim();
    } else {
      clientId = (settings.github_client_id || process.env.GITHUB_CLIENT_ID || "").trim();
      clientSecret = (settings.github_client_secret || process.env.GITHUB_CLIENT_SECRET || "").trim();
    }

    if (!clientId) {
      return result(false, "Client ID is empty.");
    }
    if (!clientSecret) {
      return result(false, "Client Secret is empty.");
    }

    if (provider === "google") {
      const redirectUri = `${getBaseUrl(req.url)}/api/auth/oauth/google/callback`;
      const authorize = await probeGoogleAuthorize(clientId, redirectUri);

      if (!authorize.ok) {
        if (authorize.error === "invalid_client") {
          return result(
            false,
            "Google could not find this Client ID. Use the full value ending in .apps.googleusercontent.com."
          );
        }
        if (authorize.error === "redirect_uri_mismatch") {
          return result(
            false,
            `Client ID is valid, but this callback URL is not registered: ${redirectUri}. Add it under "Authorized redirect URIs" in Google Cloud Console.`
          );
        }
        if (authorize.error === "invalid_request") {
          return result(
            false,
            `Google rejected the callback URL. ${authorize.description} Callback sent: ${redirectUri}`
          );
        }
        return result(
          false,
          `Google rejected the test request: ${authorize.error}${authorize.description ? ` — ${authorize.description}` : ""}`
        );
      }

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: "TEST_INVALID_CODE",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const data: OAuthErrorBody = await res.json().catch(emptyErrorBody);
      const description = cleanDescription(data.error_description);

      if (data.error === "invalid_grant") {
        return result(true, "Google credentials and callback URL are valid.");
      }
      if (data.error === "invalid_client") {
        return result(false, `Google rejected the Client Secret.${description ? ` ${description}` : ""}`);
      }
      if (data.error === "redirect_uri_mismatch") {
        return result(false, `This callback URL is not registered in Google Cloud Console: ${redirectUri}`);
      }
      if (data.error === "invalid_request") {
        return result(
          false,
          `Google rejected the test request: ${description || "invalid_request"}. Callback sent: ${redirectUri}`
        );
      }

      return result(
        false,
        `Unexpected error: ${data.error || "unknown"}${description ? ` — ${description}` : ""} (callback: ${redirectUri})`
      );
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

      const data: OAuthErrorBody = await res.json().catch(emptyErrorBody);
      const description = cleanDescription(data.error_description);

      if (description.includes("The code passed is incorrect") || data.error === "bad_verification_code") {
        return result(true, "GitHub credentials are valid.");
      }
      if (description.includes("client_id") || data.error === "incorrect_client_credentials") {
        return result(false, `Invalid GitHub Client ID or Secret.${description ? ` ${description}` : ""}`);
      }
      if (data.error) {
        return result(false, `Unexpected error: ${description || data.error}`);
      }

      return result(true, "GitHub credentials are valid.");
    }

    return result(false, "Unknown provider.");
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : "Connection failed.";
    console.error("[OAUTH TEST ERROR]", err);
    return NextResponse.json({ valid: false, message });
  }
}
