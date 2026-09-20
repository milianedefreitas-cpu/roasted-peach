"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, CheckSquare, Clock, Target,
  Menu, X, Lightbulb, BookMarked, Briefcase, HeartPulse, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePendencias } from "@/lib/hooks/usePendencias";

const PRIMARY_ITEMS = [
  { href: "/dashboard",  label: "Hoje",      icon: LayoutDashboard },
  { href: "/calendar",   label: "Agenda",    icon: CalendarDays },
  { href: "/tasks",      label: "Tarefas",   icon: CheckSquare },
  { href: "/pendencias", label: "Pendências",icon: Clock },
  { href: "/metas",      label: "Metas",     icon: Target },
];

const EXTRA_ITEMS = [
  { href: "/coach",        label: "Coach IA",     icon: Bot },
  { href: "/insights",     label: "Insights",     icon: Lightbulb },
  { href: "/estudos",      label: "Estudos",      icon: BookMarked },
  { href: "/dieta",        label: "Saúde",        icon: HeartPulse },
  { href: "/profissional", label: "Profissional", icon: Briefcase },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showExtra, setShowExtra] = useState(false);
  const { pendencias } = usePendencias({ status: "Aberta" });
  const urgentCount = pendencias.filter((p) => p.priority === "Urgente" || p.priority === "Alta").length;

  const isExtraActive = EXTRA_ITEMS.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {showExtra && (
        <div className="fixed inset-0 z-30" onClick={() => setShowExtra(false)} />
      )}

      {showExtra && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-3 grid grid-cols-2 gap-2">
            {EXTRA_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowExtra(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#30443F] border-t border-[#3D5751] safe-bottom">
        <div className="flex items-center justify-around h-16">
          {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            const showBadge = href === "/pendencias" && urgentCount > 0 && !active;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl transition-all relative",
                  active ? "text-[#FED8A6]" : "text-[#9DB4AC]"
                )}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {urgentCount > 9 ? "9+" : urgentCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium", active ? "text-[#FED8A6]" : "text-[#9DB4AC]")}>{label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-[#DAA38F] mt-0.5" />}
              </Link>
            );
          })}

          <button
            onClick={() => setShowExtra(!showExtra)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl transition-all",
              isExtraActive || showExtra ? "text-[#FED8A6]" : "text-[#9DB4AC]"
            )}
          >
            {showExtra ? <X size={22} /> : <Menu size={22} strokeWidth={1.75} />}
            <span className={cn("text-[10px] font-medium", isExtraActive || showExtra ? "text-[#FED8A6]" : "text-[#9DB4AC]")}>Mais</span>
            {isExtraActive && <span className="w-1 h-1 rounded-full bg-[#DAA38F] mt-0.5" />}
          </button>
        </div>
      </nav>
    </>
  );
}
