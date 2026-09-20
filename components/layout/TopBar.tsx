"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":      "Hoje",
  "/calendar":       "Calendário",
  "/tasks":          "Tarefas",
  "/pendencias":     "Pendências",
  "/inbox":          "Inbox",
  "/metas":          "Metas do Dia",
  "/insights":       "Insights",
  "/estudos":        "Estudos",
  "/dieta":          "Saúde",
  "/profissional":   "Área Profissional",
  "/settings":       "Configurações",
};

interface TopBarProps {
  action?: React.ReactNode;
}

export function TopBar({ action }: TopBarProps) {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "Planner";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#30443F] border-b border-[#3D5751] h-14 flex items-center px-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <h1 className="text-base font-bold text-white">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
