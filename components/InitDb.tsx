"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

const DEFAULT_METAS = [
  { type: "prioridades",     label: "3 prioridades",  icon: "ListChecks", color: "#DAA38F", is_active: true, order: 0 },
  { type: "foco",            label: "Bloco de foco",   icon: "Focus",     color: "#9B7D61", is_active: true, order: 1 },
  { type: "movimento",       label: "Movimento",       icon: "Move",      color: "#92ADA4", is_active: true, order: 2 },
  { type: "conteudo",        label: "Conteúdo",        icon: "PenLine",   color: "#DAA38F", is_active: true, order: 3 },
  { type: "segundo_cerebro", label: "Segundo cérebro", icon: "Brain",     color: "#9B7D61", is_active: true, order: 4 },
  { type: "agua",            label: "Beber água",      icon: "Droplets",  color: "#92ADA4", is_active: true, order: 5, target: 8, target_unit: "copos" },
];

export function InitDb() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    async function seed() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("metas").delete().eq("user_id", user.id).eq("type", "skincare");
      const { data: existing } = await supabase.from("metas").select("type").eq("user_id", user.id);
      const existingTypes = new Set((existing ?? []).map((m: { type: string }) => m.type));
      const toInsert = DEFAULT_METAS.filter((m) => !existingTypes.has(m.type)).map((m) => ({ ...m, user_id: user.id }));
      if (toInsert.length > 0) await supabase.from("metas").insert(toInsert);
    }

    seed().catch(console.error);
  }, []);

  return null;
}
