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

    // Busca TODOS os calendários inscritos, não só o primary
    const { data: listData } = await calendar.calendarList.list({ minAccessRole: "reader" });
    const calItems = listData.items ?? [];
    const calendarIds = calItems
      .filter((c) => !c.deleted && c.id)
      .map((c) => c.id!);

    const timeMinStr = timeMin.toISOString();
    const timeMaxStr = timeMax.toISOString();

    const results = await Promise.allSettled(
      calendarIds.map((calId) =>
        calendar.events.list({
          calendarId: calId,
          timeMin: timeMinStr,
          timeMax: timeMaxStr,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 250,
        })
      )
    );

    interface Ev {
      id: string;
      title: string;
      start?: string | null;
      end?: string | null;
      allDay: boolean;
      calendar?: string;
      color?: string;
    }
    const events: Ev[] = [];
    const calColorMap = new Map(
      calItems.map((c) => [c.id ?? "", c.backgroundColor ?? "#92ADA4"])
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status !== "fulfilled") continue;
      const calName = calItems[i]?.summary ?? "Calendário";
      const calColor = calColorMap.get(calendarIds[i]) ?? "#92ADA4";
      for (const e of r.value.data.items ?? []) {
        if (!e.id) continue;
        events.push({
          id: e.id,
          title: e.summary ?? "(sem título)",
          start: e.start?.dateTime ?? e.start?.date,
          end: e.end?.dateTime ?? e.end?.date,
          allDay: !e.start?.dateTime,
          calendar: calName,
          color: calColor,
        });
      }
    }

    events.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
    return NextResponse.json({ events });
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erro ao buscar eventos.";
    return NextResponse.json({ error: m }, { status: 502 });
  }
}
