"use client";

import { BookOpen, Droplets, Apple, Dumbbell, Sparkles, Star, Loader2, Plus, Minus, Heart, Zap, Music, Smile, Coffee, Sun, Moon, BookMarked, ListChecks, Focus, Move, PenLine, Brain } from "lucide-react";
import { useMetas, useDailyChecks } from "@/lib/hooks/useMetas";
import { cn } from "@/lib/utils/cn";
import type { Meta } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Droplets, Apple, Dumbbell, Sparkles, Star, Heart, Zap, Music, Smile, Coffee, Sun, Moon, BookMarked,
  ListChecks, Focus, Move, PenLine, Brain,
};

interface MetaItemProps {
  meta: Meta;
  isChecked: boolean;
  value: number;
  onToggle: () => void;
  onValueChange?: (v: number) => void;
  compact?: boolean;
}

function MetaItem({ meta, isChecked, value, onToggle, onValueChange, compact }: MetaItemProps) {
  const Icon = ICON_MAP[meta.icon] ?? Star;
  const hasTarget = !!meta.target;

  if (compact) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
          isChecked
            ? "border-transparent text-white shadow-sm"
            : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
        )}
        style={isChecked ? { backgroundColor: meta.color } : undefined}
      >
        <Icon size={14} />
        <span className="text-xs font-medium">{meta.label}</span>
        {isChecked && <span className="text-xs opacity-75">✓</span>}
      </button>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
      isChecked ? "border-transparent shadow-sm" : "border-gray-100 bg-white"
    )}
    style={isChecked ? { backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` } : undefined}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0",
          isChecked ? "scale-95" : "bg-gray-50 hover:scale-95"
        )}
        style={isChecked ? { backgroundColor: meta.color } : undefined}
      >
        <Icon size={18} className={isChecked ? "text-white" : "text-gray-500"} />
      </button>

      <div className="flex-1">
        <p className={cn("text-sm font-semibold", isChecked ? "text-gray-900" : "text-gray-700")}>
          {meta.label}
        </p>
        {hasTarget && (
          <p className="text-xs text-gray-400">{value}/{meta.target} {meta.targetUnit}</p>
        )}
      </div>

      {hasTarget && onValueChange ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onValueChange(Math.max(0, value - 1))}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-bold w-6 text-center" style={{ color: meta.color }}>{value}</span>
          <button
            onClick={() => onValueChange(Math.min(meta.target! * 2, value + 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors"
            style={{ backgroundColor: meta.color }}
          >
            <Plus size={12} />
          </button>
        </div>
      ) : (
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          isChecked ? "border-transparent" : "border-gray-300"
        )}
        style={isChecked ? { backgroundColor: meta.color } : undefined}
        onClick={onToggle}
        >
          {isChecked && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      )}
    </div>
  );
}

interface DailyChecklistProps {
  date?: string;
  compact?: boolean;
}

export function DailyChecklist({ date, compact }: DailyChecklistProps) {
  const { metas } = useMetas();
  const { isChecked, getValue, toggleCheck, updateValue } = useDailyChecks(date);

  if (!metas) {
    return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-purple-400" /></div>;
  }

  if (metas.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Nenhuma meta ativa.</p>;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {metas.map((meta) => (
          <MetaItem
            key={meta.id}
            meta={meta}
            isChecked={isChecked(meta.id!)}
            value={getValue(meta.id!)}
            onToggle={() => toggleCheck(meta.id!, !isChecked(meta.id!))}
            compact
          />
        ))}
      </div>
    );
  }

  const done = metas.filter((m) => isChecked(m.id!)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{done}/{metas.length} concluídas</p>
        <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${metas.length ? (done / metas.length) * 100 : 0}%`,
              backgroundColor: "#DAA38F",
            }}
          />
        </div>
        <span className="text-xs font-bold text-purple-600">
          {metas.length ? Math.round((done / metas.length) * 100) : 0}%
        </span>
      </div>

      {metas.map((meta) => (
        <MetaItem
          key={meta.id}
          meta={meta}
          isChecked={isChecked(meta.id!)}
          value={getValue(meta.id!)}
          onToggle={() => toggleCheck(meta.id!, !isChecked(meta.id!))}
          onValueChange={meta.target ? (v) => updateValue(meta.id!, v, meta.target) : undefined}
        />
      ))}
    </div>
  );
}
