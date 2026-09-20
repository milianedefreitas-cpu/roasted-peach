"use client";

import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg, EventDropArg } from "@fullcalendar/core";
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCw } from "lucide-react";
import { useTasks } from "@/lib/hooks/useTasks";
import { CATEGORY_CONFIG } from "@/lib/constants/categories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Task } from "@/types";

function taskToEvent(task: Task): EventInput {
  const color = task.color || CATEGORY_CONFIG[task.category]?.color || "#6B7280";
  return {
    id: String(task.id),
    title: task.tag ? `[${task.tag}] ${task.title}` : task.title,
    start: task.startTime ? `${task.date}T${task.startTime}` : task.date,
    end: task.endTime ? `${task.date}T${task.endTime}` : undefined,
    allDay: !task.startTime,
    backgroundColor: color,
    borderColor: color,
    textColor: "#fff",
    extendedProps: { taskId: task.id, status: task.status, category: task.category },
  };
}

type ViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

interface GoogleEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
}

interface CalendarViewProps {
  onEventClick?: (taskId: number) => void;
  onDateClick?: (date: string, time?: string) => void;
}

export function CalendarView({ onEventClick, onDateClick }: CalendarViewProps) {
  const calRef = useRef<FullCalendar>(null);
  const { tasks, moveTask } = useTasks();
  const [view, setView] = useState<ViewType>("timeGridWeek");
  const [title, setTitle] = useState("");
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshGoogle() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/google/calendar");
      const d = r.ok ? await r.json() : { events: [] };
      setGoogleEvents(d.events ?? []);
    } catch {} finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile && view === "timeGridWeek") {
      setView("timeGridDay");
      calRef.current?.getApi().changeView("timeGridDay");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetch("/api/google/calendar");
        const d = r.ok ? await r.json() : { events: [] };
        if (active) setGoogleEvents(d.events ?? []);
      } catch {}
    }
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const events: EventInput[] = [
    ...(tasks ?? []).filter((t) => t.showInCalendar !== false).map(taskToEvent),
    ...googleEvents.map((e): EventInput => ({
      id: `g-${e.id}`,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: "#92ADA4",
      borderColor: "#92ADA4",
      textColor: "#2F2925",
      editable: false,
      extendedProps: { google: true },
    })),
  ];

  function navigate(dir: "prev" | "next" | "today") {
    const api = calRef.current?.getApi();
    if (!api) return;
    if (dir === "prev") api.prev();
    else if (dir === "next") api.next();
    else api.today();
    setTitle(api.view.title);
  }

  function switchView(v: ViewType) {
    setView(v);
    calRef.current?.getApi().changeView(v);
  }

  function handleEventClick(arg: EventClickArg) {
    if (arg.event.extendedProps.google) return;
    const taskId = Number(arg.event.extendedProps.taskId);
    onEventClick?.(taskId);
  }

  function handleDateClick(arg: { date: Date; allDay: boolean }) {
    const date = format(arg.date, "yyyy-MM-dd");
    const time = arg.allDay ? undefined : format(arg.date, "HH:mm");
    onDateClick?.(date, time);
  }

  async function handleEventDrop(arg: EventDropArg) {
    if (arg.event.extendedProps.google) return;
    const taskId = Number(arg.event.extendedProps.taskId);
    const newDate = format(arg.event.start!, "yyyy-MM-dd");
    const newStart = arg.event.start ? format(arg.event.start, "HH:mm") : undefined;
    const newEnd = arg.event.end ? format(arg.event.end, "HH:mm") : undefined;
    await moveTask(taskId, newDate, newStart, newEnd);
  }

  const VIEW_LABELS: Record<ViewType, string> = {
    dayGridMonth: "Mês",
    timeGridWeek: "Semana",
    timeGridDay: "Dia",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Custom Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("prev")} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => navigate("today")} className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-xl transition-colors">
            <CalendarDays size={14} /> Hoje
          </button>
          <button onClick={() => navigate("next")} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={refreshGoogle}
            disabled={refreshing}
            title="Atualizar eventos do Google"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-800 capitalize flex-1 text-center">{title}</p>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["dayGridMonth", "timeGridWeek", "timeGridDay"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                view === v ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={false}
          editable
          droppable
          events={events}
          locale="pt-br"
          height="100%"
          nowIndicator
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          datesSet={(info) => setTitle(info.view.title)}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        />
      </div>
    </div>
  );
}
