import { google } from "googleapis";
import type { createClient as createServerClient } from "@/lib/supabase/server";

export type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function googleOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function googleRedirectUri(origin: string) {
  return process.env.GOOGLE_REDIRECT_URI ?? `${origin}/api/google/callback`;
}

export async function getAuthorizedClient(
  supabase: ServerSupabase,
  userId: string
) {
  const { data: row } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!row) return null;

  const oauth2 = googleOAuthClient(process.env.GOOGLE_REDIRECT_URI ?? "");
  oauth2.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token ?? undefined,
    expiry_date: new Date(row.expires_at).getTime(),
  });

  // Persistir access token renovado
  oauth2.on("tokens", async (tokens) => {
    const update: Record<string, unknown> = {};
    if (tokens.access_token) {
      update.access_token = tokens.access_token;
      update.expires_at = new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString();
    }
    if (tokens.refresh_token) update.refresh_token = tokens.refresh_token;
    if (Object.keys(update).length > 0) {
      await supabase.from("google_tokens").update(update).eq("user_id", userId);
    }
  });

  return oauth2;
}
