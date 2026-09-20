"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Clock, CalendarDays, TrendingUp, Zap } from "lucide-react";
import { useTasks } from "@/lib/hooks/useTasks";
import { usePendencias } from "@/lib/hooks/usePendencias";
import { useMetas, useDailyChecks } from "@/lib/hooks/useMetas";
import { useFreeSlots } from "@/lib/hooks/useSmartScheduler";
import { TaskCard } from "@/components/tasks/TaskCard";
import { DailyChecklist } from "@/components/metas/DailyChecklist";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { PendenciaCard } from "@/components/pendencias/PendenciaCard";
import { PendenciaFormModal } from "@/components/pendencias/PendenciaFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { todayISO, formatDateLong, formatTime, formatDuration } from "@/lib/utils/date";

interface GoogleEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  calendar?: string;
  color?: string;
}

export default function DashboardPage() {
  const today = todayISO();
  const { tasks } = useTasks({ date: today });
  const { pendencias } = usePendencias({ status: "Aberta" });
  const { metas } = useMetas();
  const { isChecked } = useDailyChecks(today);
  const freeSlots = useFreeSlots(2);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [pendenciaModalOpen, setPendenciaModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editPendenciaId, setEditPendenciaId] = useState<number | null>(null);
  const [scheduleFromPendenciaId, setScheduleFromPendenciaId] = useState<number | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);

  useEffect(() => {
    fetch("/api/google/calendar?days=1")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => {
        const evs = (d.events ?? []).filter((e: GoogleEvent) => {
          const start = e.start.slice(0, 10);
          return start === today;
        });
        setGoogleEvents(evs);
      })
      .catch(() => {});
  }, [today]);

  const urgentPendencias = pendencias
    .filter((p) => p.priority === "Urgente" || p.priority === "Alta")
    .slice(0, 3);

  const activeTasks = tasks.filter((t) => t.status !== "Cancelada");
  const doneTasks = tasks.filter((t) => t.status === "Concluída");
  const metasDone = metas.filter((m) => isChecked(m.id!)).length;
  const completionRate = activeTasks.length > 0 ? Math.round((doneTasks.length / activeTasks.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      {/* Hero greeting */}
      <div className="bg-[#30443F] rounded-3xl p-6 shadow-md">
        <p className="text-sm font-medium mb-1 capitalize text-[#9DB4AC]">{formatDateLong(today)}</p>
        <h1 className="text-3xl font-bold mb-4 text-white font-display">
          {(() => { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; })()}! ✨
        </h1>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,.08)" }}>
            <p className="text-2xl font-bold text-[#FED8A6]">{activeTasks.length}</p>
            <p className="text-xs mt-0.5 text-[#C9D6D0]">Tarefas hoje</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,.08)" }}>
            <p className="text-2xl font-bold text-[#FED8A6]">{pendencias.length}</p>
            <p className="text-xs mt-0.5 text-[#C9D6D0]">Pendências</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,.08)" }}>
            <p className="text-2xl font-bold text-[#FED8A6]">{metasDone}/{metas.length}</p>
            <p className="text-xs mt-0.5 text-[#C9D6D0]">Metas</p>
          </div>
        </div>

        {activeTasks.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 text-[#C9D6D0]">
              <span>Progresso do dia</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.12)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%`, background: "#DAA38F" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" fullWidth onClick={() => setTaskModalOpen(true)} className="py-3 justify-start gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Plus size={16} className="text-white" />
          </div>
          <span className="text-left">
            <span className="block text-sm font-semibold text-gray-900">Nova tarefa</span>
            <span className="block text-xs text-gray-500">Adicionar ao dia</span>
          </span>
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setPendenciaModalOpen(true)} className="py-3 justify-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={16} className="text-white" />
          </div>
          <span className="text-left">
            <span className="block text-sm font-semibold text-gray-900">Nova pendência</span>
            <span className="block text-xs text-gray-500">Anotar rapidinho</span>
          </span>
        </Button>
      </div>

      {/* Compromissos do dia (Agenda + Google) */}
      {(activeTasks.some((t) => t.startTime) || googleEvents.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={16} className="text-[#5F8277]" />
            <h2 className="text-base font-bold text-gray-900">Agenda de hoje</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#E3D5C6] p-4 space-y-2">
            {/* Google Calendar */}
            {googleEvents.map((e) => {
              const hora = e.allDay ? "Dia todo" : e.start.slice(11, 16);
              return (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F6FAF8] border border-[#D5E3DE]">
                  <span className="text-xs font-semibold text-[#5F8277] min-w-[55px]">{hora}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                    <span className="text-[10px] text-[#5F8277] font-semibold uppercase tracking-wider">Google Calendar</span>
                  </div>
                </div>
              );
            })}

            {/* Tarefas com horário */}
            {activeTasks
              .filter((t) => t.startTime)
              .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
              .map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FFFDF9] border border-gray-100">
                  <span className="text-xs font-semibold text-[#DAA38F] min-w-[55px]">{t.startTime}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${t.status === "Concluída" ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {t.title}
                    </p>
                    <span className="text-[10px] text-gray-400">{t.category}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Metas do dia */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-purple-500" />
          <h2 className="text-base font-bold text-gray-900">Metas do dia</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <DailyChecklist date={today} compact />
        </div>
      </section>

      {/* Free slots */}
      {freeSlots.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-green-500" />
            <h2 className="text-base font-bold text-gray-900">Brechas disponíveis hoje</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {freeSlots.slice(0, 4).map((slot, i) => (
              <div key={i} className="bg-green-50 border border-green-100 rounded-2xl p-3 shrink-0 min-w-[130px]">
                <p className="text-sm font-bold text-green-700">{formatTime(slot.startTime)}</p>
                <p className="text-xs text-green-600">{formatDuration(slot.durationMinutes)} livre</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Today's tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-purple-500" />
            <h2 className="text-base font-bold text-gray-900">Tarefas de hoje</h2>
          </div>
          <span className="text-xs text-gray-400">{doneTasks.length}/{activeTasks.length}</span>
        </div>
        {activeTasks.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Dia livre!"
            description="Nenhuma tarefa para hoje. Que tal planejar algo?"
            action={<Button size="sm" onClick={() => setTaskModalOpen(true)}>+ Criar tarefa</Button>}
          />
        ) : (
          <div className="space-y-2">
            {activeTasks
              .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(id) => { setEditTaskId(id); setTaskModalOpen(true); }}
                  compact
                />
              ))}
          </div>
        )}
      </section>

      {/* Urgent pendências */}
      {urgentPendencias.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-red-400" />
            <h2 className="text-base font-bold text-gray-900">Pendências urgentes</h2>
          </div>
          <div className="space-y-2">
            {urgentPendencias.map((p) => (
              <PendenciaCard
                key={p.id}
                pendencia={p}
                onEdit={(id) => { setEditPendenciaId(id); setPendenciaModalOpen(true); }}
                onAddToCalendar={(id) => { setScheduleFromPendenciaId(id); setEditTaskId(null); setTaskModalOpen(true); }}
              />
            ))}
          </div>
        </section>
      )}

      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditTaskId(null); setScheduleFromPendenciaId(null); }}
        taskId={editTaskId}
        initialDate={today}
        pendenciaId={scheduleFromPendenciaId}
      />
      <PendenciaFormModal
        isOpen={pendenciaModalOpen}
        onClose={() => { setPendenciaModalOpen(false); setEditPendenciaId(null); }}
        pendenciaId={editPendenciaId}
      />
    </div>
  );
}
