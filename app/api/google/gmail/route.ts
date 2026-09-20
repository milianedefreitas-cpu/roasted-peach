import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizedClient } from "@/lib/google";

interface GmailHeader {
  name: string;
  value: string | undefined;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticada" }, { status: 401 });

  const auth = await getAuthorizedClient(supabase, user.id);
  if (!auth) return NextResponse.json({ error: "Google não conectado" }, { status: 403 });

  try {
    const gmail = google.gmail({ version: "v1", auth });
    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
    });

    const ids = (data.messages ?? []).map((m) => m.id!).filter(Boolean);
    const messages = await Promise.all(
      ids.map(async (id) => {
        const { data: msg } = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });
        const headers = (msg.payload?.headers ?? []) as GmailHeader[];
        const header = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
        return {
          id,
          from: header("From"),
          subject: header("Subject") || "(sem assunto)",
          date: header("Date"),
          snippet: msg.snippet ?? "",
        };
      })
    );
    return NextResponse.json({ messages });
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erro ao buscar emails.";
    return NextResponse.json({ error: m }, { status: 502 });
  }
}
