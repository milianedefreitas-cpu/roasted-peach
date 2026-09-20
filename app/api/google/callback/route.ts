import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleOAuthClient, googleRedirectUri } from "@/lib/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const origin = url.origin;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // valida state contra o registro da etapa /auth (CSRF)
  const { data: stateRow } = await supabase
    .from("google_oauth_state")
    .select("user_id, created_at")
    .eq("state", state ?? "")
    .maybeSingle();

  const stateValid =
    !!stateRow &&
    !!user &&
    stateRow.user_id === user.id &&
    Date.now() - new Date(stateRow.created_at).getTime() < 10 * 60_000;

  if (stateRow) await supabase.from("google_oauth_state").delete().eq("state", state ?? "");

  if (!user || !code || !stateValid) {
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }

  try {
    const oauth2 = googleOAuthClient(googleRedirectUri(origin));
    const { tokens } = await oauth2.getToken(code);

    const expiresAt = new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString();
    const { error } = await supabase.from("google_tokens").upsert({
      user_id: user.id,
      access_token: tokens.access_token ?? "",
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      scope: tokens.scope ?? null,
    });
    if (error) return NextResponse.redirect(`${origin}/settings?google=error`);
    return NextResponse.redirect(`${origin}/settings?google=connected`);
  } catch {
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }
}
