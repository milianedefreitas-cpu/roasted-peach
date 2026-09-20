import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { googleOAuthClient, GOOGLE_SCOPES, googleRedirectUri } from "@/lib/google";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticada" }, { status: 401 });

  const origin = new URL(request.url).origin;
  const state = randomUUID();
  await supabase.from("google_oauth_state").insert({ user_id: user.id, state });
  const oauth2 = googleOAuthClient(googleRedirectUri(origin));
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
  });
  return NextResponse.redirect(url);
}
