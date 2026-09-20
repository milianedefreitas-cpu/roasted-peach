import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizedClient } from "@/lib/google";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticada" }, { status: 401 });

  const auth = await getAuthorizedClient(supabase, user.id);
  if (!auth) return NextResponse.json({ error: "Google não conectado" }, { status: 403 });

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 7), 1), 30);
  const timeMin = new Date();
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + days);

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const events = (data.items ?? []).map((e) => ({
      id: e.id,
      title: e.summary ?? "(sem título)",
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      allDay: !e.start?.dateTime,
      location: e.location ?? undefined,
      description: e.description ?? undefined,
    }));
    return NextResponse.json({ events });
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erro ao buscar eventos.";
    return NextResponse.json({ error: m }, { status: 502 });
  }
}
