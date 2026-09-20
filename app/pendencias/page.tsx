"use client";

import { useState } from "react";
import { Plus, Search, Clock, Zap, GripVertical, Mail, X } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePendencias } from "@/lib/hooks/usePendencias";
import { PendenciaCard } from "@/components/pendencias/PendenciaCard";
import { PendenciaFormModal } from "@/components/pendencias/PendenciaFormModal";
import { GmailImportModal } from "@/components/pendencias/GmailImportModal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories";
import { cn } from "@/lib/utils/cn";
import type { Category, Pendencia, PendenciaStatus } from "@/types";

const STATUS_FILTERS: { value: PendenciaStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "Aberta", label: "Abertas" },
  { value: "Agendada", label: "Agendadas" },
  { value: "Concluída", label: "Concluídas" },
];

function SortablePendenciaCard({
  pendencia,
  onEdit,
  onAddToCalendar,
}: {
  pendencia: Pendencia;
  onEdit?: (id: number) => void;
  onAddToCalendar?: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pendencia.id!,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-1"
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 p-1 cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 touch-none select-none"
        tabIndex={-1}
        aria-label="Arrastar pendência"
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <PendenciaCard
          pendencia={pendencia}
          onEdit={onEdit}
          onAddToCalendar={onAddToCalendar}
        />
      </div>
    </div>
  );
}

export default function PendenciasPage() {
  const [filterStatus, setFilterStatus] = useState<PendenciaStatus | "all">("Aberta");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [pendenciaModalOpen, setPendenciaModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editPendenciaId, setEditPendenciaId] = useState<number | null>(null);
  const [scheduleFromPendenciaId, setScheduleFromPendenciaId] = useState<number | null>(null);
  const [gmailOpen, setGmailOpen] = useState(false);

  const { pendencias, createPendencia, reorderPendencias } = usePendencias({
    status: filterStatus !== "all" ? filterStatus : undefined,
    category: filterCategory !== "all" ? filterCategory : undefined,
  });

  const filtered = pendencias.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = pendencias.filter((p) => p.status === "Aberta").length;
  const urgentCount = pendencias.filter((p) =>
    p.status === "Aberta" && (p.priority === "Urgente" || p.priority === "Alta")
  ).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex((p) => p.id === active.id);
    const newIndex = filtered.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filtered, oldIndex, newIndex);
    await reorderPendencias(reordered.map((p) => p.id!));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 md:block hidden">Pendências</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => setGmailOpen(true)} size="sm" variant="secondary">
            <Mail size={16} /> Gmail
          </Button>
          <Button onClick={() => { setEditPendenciaId(null); setPendenciaModalOpen(true); }} size="sm">
            <Plus size={16} /> Nova pendência
          </Button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Clock size={14} className="text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">{openCount}</span>
          <span className="text-xs text-blue-500">abertas</span>
        </div>
        {urgentCount > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-2 flex items-center gap-2">
            <Zap size={14} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">{urgentCount}</span>
            <span className="text-xs text-red-500">urgentes</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar pendências..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all",
              filterStatus === f.value
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory("all")}
          className={cn(
            "text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all",
            filterCategory === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white border-gray-200 text-gray-600"
          )}
        >
          Todas
        </button>
        {CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const active = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(active ? "all" : cat)}
              style={active
                ? { backgroundColor: config.color, color: "#fff", borderColor: config.color }
                : { backgroundColor: "#fff", color: config.color, borderColor: `${config.color}40` }
              }
              className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all"
            >
              {config.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} pendência{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={filterStatus === "Aberta" ? "Tudo resolvido!" : "Nada aqui"}
          description={filterStatus === "Aberta" ? "Sem pendências abertas. Ótimo trabalho!" : "Ajuste os filtros para ver mais."}
          action={<Button size="sm" onClick={() => { setEditPendenciaId(null); setPendenciaModalOpen(true); }}>+ Nova pendência</Button>}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((p) => p.id!)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filtered.map((p) => (
                <SortablePendenciaCard
                  key={p.id}
                  pendencia={p}
                  onEdit={(id) => { setEditPendenciaId(id); setPendenciaModalOpen(true); }}
                  onAddToCalendar={(id) => { setScheduleFromPendenciaId(id); setTaskModalOpen(true); }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PendenciaFormModal
        isOpen={pendenciaModalOpen}
        onClose={() => { setPendenciaModalOpen(false); setEditPendenciaId(null); }}
        pendenciaId={editPendenciaId}
      />

      <GmailImportModal
        isOpen={gmailOpen}
        onClose={() => setGmailOpen(false)}
        onImport={async (email) => {
          await createPendencia({
            title: email.subject,
            description: `De: ${email.from}\n\n${email.snippet}`,
            estimatedMinutes: 30,
            category: "Pessoal",
            priority: "Média",
            status: "Aberta",
          });
        }}
      />

      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setScheduleFromPendenciaId(null); }}
        pendenciaId={scheduleFromPendenciaId}
      />
    </div>
  );
}
