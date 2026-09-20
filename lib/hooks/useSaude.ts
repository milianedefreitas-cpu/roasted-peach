"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface Medicamento {
  id: number;
  nome: string;
  doseMg: number | null;
  frequencia: string;
  diaSemana: number | null;
  hora: string;
  ativo: boolean;
}

export interface Dose {
  id: number;
  medicamentoId: number;
  agendadaEm: string;
  aplicadaEm: string | null;
  doseMg: number | null;
  localAplicacao: string | null;
  status: "agendada" | "aplicada" | "pulada";
  observacoes: string | null;
}

export interface PesoLog {
  id: number;
  data: string;
  pesoKg: number;
  bustoCm?: number | null;
  cinturaCm?: number | null;
  quadrilCm?: number | null;
}

export function useSaude() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [pesos, setPesos] = useState<PesoLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [mRes, dRes, pRes] = await Promise.all([
      supabase.from("saude_medicamentos").select("*").eq("ativo", true).order("id"),
      supabase.from("saude_doses").select("*").order("agendada_em", { ascending: false }).limit(30),
      supabase.from("saude_pesos").select("*").order("data", { ascending: true }),
    ]);

    if (mRes.data) {
      setMedicamentos(mRes.data.map((r) => ({
        id: r.id,
        nome: r.nome,
        doseMg: r.dose_mg,
        frequencia: r.frequencia,
        diaSemana: r.dia_semana,
        hora: r.hora,
        ativo: r.ativo,
      })));
    }
    if (dRes.data) {
      setDoses(dRes.data.map((r) => ({
        id: r.id,
        medicamentoId: r.medicamento_id,
        agendadaEm: r.agendada_em,
        aplicadaEm: r.aplicada_em,
        doseMg: r.dose_mg,
        localAplicacao: r.local_aplicacao,
        status: r.status,
        observacoes: r.observacoes,
      })));
    }
    if (pRes.data) {
      setPesos(pRes.data.map((r) => ({
        id: r.id,
        data: r.data,
        pesoKg: Number(r.peso_kg),
        bustoCm: r.busto_cm,
        cinturaCm: r.cintura_cm,
        quadrilCm: r.quadril_cm,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function addPeso(data: string, pesoKg: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("saude_pesos").upsert({
      user_id: user.id,
      data,
      peso_kg: pesoKg,
    }, { onConflict: "user_id,data" });
    await fetchAll();
  }

  async function registrarDose(medicamentoId: number, doseMg: number | null, local: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const agora = new Date().toISOString();
    await supabase.from("saude_doses").insert({
      user_id: user.id,
      medicamento_id: medicamentoId,
      agendada_em: agora,
      aplicada_em: agora,
      dose_mg: doseMg,
      local_aplicacao: local,
      status: "aplicada",
    });
    await fetchAll();
  }

  async function importGlpBackup(jsonText: string): Promise<{ imported: number; errors: string[] }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticada");

    const data = JSON.parse(jsonText);
    const errors: string[] = [];
    let count = 0;

    // 1. Medicamentos
    const medMap = new Map<number | string, number>();
    if (Array.isArray(data.medications)) {
      for (const m of data.medications) {
        const { data: inserted, error } = await supabase.from("saude_medicamentos").insert({
          user_id: user.id,
          nome: m.name ?? m.nome ?? "Medicamento",
          dose_mg: m.currentDoseMg ?? m.dose_mg ?? null,
          frequencia: m.frequency ?? "semanal",
          dia_semana: m.dayOfWeek ?? m.dia_semana ?? 0,
          hora: m.time ?? "08:00",
          ativo: true,
        }).select("id").single();
        if (error) errors.push(`med ${m.name}: ${error.message}`);
        else if (inserted) {
          medMap.set(m.id, inserted.id);
          count++;
        }
      }
    }

    // fallback: se não tinha medicamentos mas tem doses, cria um padrão
    let defaultMedId = medMap.values().next().value;
    if (!defaultMedId && Array.isArray(data.doseLogs) && data.doseLogs.length > 0) {
      const { data: defMed } = await supabase.from("saude_medicamentos").insert({
        user_id: user.id,
        nome: "Tirzepatida (TG)",
        frequencia: "semanal",
      }).select("id").single();
      if (defMed) defaultMedId = defMed.id;
    }

    // 2. Doses
    if (Array.isArray(data.doseLogs)) {
      for (const d of data.doseLogs) {
        const medId = medMap.get(d.medicationId) ?? defaultMedId;
        if (!medId) continue;
        const agendada = d.scheduledAt || d.takenAt || d.date || new Date().toISOString();
        const { error } = await supabase.from("saude_doses").insert({
          user_id: user.id,
          medicamento_id: medId,
          agendada_em: new Date(agendada).toISOString(),
          aplicada_em: d.takenAt ? new Date(d.takenAt).toISOString() : (d.status === "taken" ? new Date(agendada).toISOString() : null),
          dose_mg: d.doseMg ?? null,
          local_aplicacao: d.site ?? d.local ?? null,
          status: d.takenAt || d.status === "taken" ? "aplicada" : "agendada",
          observacoes: d.notes ?? null,
        });
        if (error) errors.push(`dose: ${error.message}`);
        else count++;
      }
    }

    // 3. Pesos
    if (Array.isArray(data.bodyLogs)) {
      for (const b of data.bodyLogs) {
        if (!b.date || !b.weightKg) continue;
        const { error } = await supabase.from("saude_pesos").upsert({
          user_id: user.id,
          data: b.date.slice(0, 10),
          peso_kg: b.weightKg,
          busto_cm: b.bustCm ?? null,
          cintura_cm: b.waistCm ?? null,
          quadril_cm: b.hipsCm ?? null,
        }, { onConflict: "user_id,data" });
        if (error) errors.push(`peso ${b.date}: ${error.message}`);
        else count++;
      }
    }

    await fetchAll();
    return { imported: count, errors };
  }

  return {
    medicamentos,
    doses,
    pesos,
    loading,
    addPeso,
    registrarDose,
    importGlpBackup,
    refresh: fetchAll,
  };
}
