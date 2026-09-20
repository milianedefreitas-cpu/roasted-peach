"use client";

import { useRef, useState } from "react";
import {
  HeartPulse, Syringe, Scale, Upload, Check, Calendar,
} from "lucide-react";
import { useSaude } from "@/lib/hooks/useSaude";
import { Button } from "@/components/ui/Button";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const LOCAIS = ["Barriga", "Coxa E", "Coxa D", "Braço E", "Braço D"];

function nextDoseInfo(doses: ReturnType<typeof useSaude>["doses"], medicamentos: ReturnType<typeof useSaude>["medicamentos"]) {
  const med = medicamentos[0];
  if (!med) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const agendadas = doses
    .filter((d) => d.status === "agendada" && parseISO(d.agendadaEm) >= hoje)
    .sort((a, b) => a.agendadaEm.localeCompare(b.agendadaEm));

  if (agendadas.length > 0) {
    const proxima = parseISO(agendadas[0].agendadaEm);
    return { proxima, dias: differenceInDays(proxima, hoje), med };
  }

  const aplicadas = doses.filter((d) => d.status === "aplicada").sort((a, b) => b.agendadaEm.localeCompare(a.agendadaEm));
  if (aplicadas.length > 0) {
    const ultima = parseISO(aplicadas[0].agendadaEm);
    const proxima = new Date(ultima);
    proxima.setDate(proxima.getDate() + (med.frequencia === "diaria" ? 1 : 7));
    return { proxima, dias: differenceInDays(proxima, hoje), med };
  }
  return null;
}

export default function SaudePage() {
  const { medicamentos, doses, pesos, loading, addPeso, registrarDose, importGlpBackup } = useSaude();
  const [pesoInput, setPesoInput] = useState("");
  const [cinturaInput, setCinturaInput] = useState("");
  const [localSelecionado, setLocalSelecionado] = useState("Barriga");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pesoAtual = pesos.length > 0 ? pesos[pesos.length - 1].pesoKg : null;
  const pesoAnterior = pesos.length > 1 ? pesos[pesos.length - 2].pesoKg : null;
  const diferenca = pesoAtual !== null && pesoAnterior !== null ? +(pesoAtual - pesoAnterior).toFixed(1) : null;
  const metaImportada = diferenca !== null ? (diferenca <= 0 ? "↓" : "↑") : "";
  const proxima = nextDoseInfo(doses, medicamentos);

  async function handlePeso(e: React.FormEvent) {
    e.preventDefault();
    if (!pesoInput) return;
    const hoje = format(new Date(), "yyyy-MM-dd");
    await addPeso(hoje, Number(pesoInput));
    setPesoInput("");
    setCinturaInput("");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("Importando...");
    try {
      const text = await file.text();
      const result = await importGlpBackup(text);
      setImportMsg(
        result.errors.length > 0
          ? `${result.imported} registros importados, ${result.errors.length} erros.`
          : `${result.imported} registros importados com sucesso!`
      );
    } catch (err) {
      setImportMsg(`Erro: ${(err as Error).message}`);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><p className="text-sm text-gray-500">Carregando...</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      <h1 className="text-xl font-bold text-gray-900 md:block hidden">Saúde</h1>

      {medicamentos.length === 0 && pesos.length === 0 && doses.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#D8C5B5] p-6 text-center space-y-3 bg-[#FFFDF9]">
          <Upload size={28} className="mx-auto text-[#DAA38F]" />
          <p className="text-sm font-medium text-gray-900">Importar dados do GLP Tracker</p>
          <p className="text-xs text-gray-500">Carregue o backup JSON exportado do app antigo para trazer peso, doses e histórico.</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="glp-import" />
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Escolher arquivo
          </Button>
          {importMsg && <p className="text-xs text-[#5F8277]">{importMsg}</p>}
        </div>
      )}

      {/* Próxima dose */}
      <section className="bg-[#30443F] rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Syringe size={16} className="text-[#FED8A6]" />
          <p className="text-xs font-medium text-[#9DB4AC] uppercase tracking-wide">Próxima dose</p>
        </div>
        {proxima ? (
          <>
            <p className="text-2xl font-bold font-display mb-1">
              {proxima.dias <= 0 ? "Hoje!" : proxima.dias === 1 ? "Amanhã" : `Em ${proxima.dias} dias`}
            </p>
            <p className="text-sm text-[#C9D6D0]">
              {proxima.med.nome}
              {proxima.med.doseMg ? ` · ${proxima.med.doseMg}mg` : ""}
              {" · "}
              {format(proxima.proxima, "dd 'de' MMM, HH'mm'", { locale: ptBR })}
            </p>
            <div className="mt-4">
              <p className="text-xs text-[#9DB4AC] mb-2">Local da aplicação</p>
              <div className="flex flex-wrap gap-2">
                {LOCAIS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocalSelecionado(l)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                      localSelecionado === l
                        ? "bg-[#DAA38F] text-[#2F2925]"
                        : "bg-white/10 text-[#C9D6D0] hover:bg-white/20"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={async () => {
                  await registrarDose(proxima.med.id, proxima.med.doseMg, localSelecionado);
                }}
              >
                <Check size={14} /> Registrar dose aplicada agora
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#C9D6D0]">Nenhum medicamento cadastrado. Importe seu backup do GLP Tracker acima.</p>
        )}
      </section>

      {/* Peso atual + registro */}
      <section className="bg-[#FFFDF9] rounded-2xl border border-[#E3D5C6] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-[#DAA38F]" />
            <h2 className="font-semibold text-gray-900">Peso</h2>
          </div>
          {pesoAtual !== null && (
            <div className="text-right">
              <p className="text-2xl font-bold text-[#9B7D61]">
                {pesoAtual}<span className="text-sm font-normal"> kg</span>
              </p>
              {diferenca !== null && (
                <p className={`text-xs ${diferenca <= 0 ? "text-[#5F8277]" : "text-red-500"}`}>
                  {metaImportada} {Math.abs(diferenca)} kg desde a última pesagem
                </p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handlePeso} className="flex gap-2">
          <input
            type="number"
            step="0.1"
            value={pesoInput}
            onChange={(e) => setPesoInput(e.target.value)}
            placeholder="Peso (kg)"
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#DAA38F]"
          />
          <input
            type="number"
            step="0.1"
            value={cinturaInput}
            onChange={(e) => setCinturaInput(e.target.value)}
            placeholder="Cintura (cm)"
            className="w-28 text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#DAA38F]"
          />
          <Button type="submit" size="sm" disabled={!pesoInput}>Registrar</Button>
        </form>

        {pesos.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            {[...pesos].reverse().slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{format(parseISO(p.data), "dd MMM", { locale: ptBR })}</span>
                <span className="font-medium text-gray-900">{p.pesoKg} kg{p.cinturaCm ? ` · ${p.cinturaCm}cm` : ""}</span>
              </div>
            ))}
            {pesos.length > 5 && (
              <p className="text-xs text-gray-400 pt-1">{pesos.length} registros no total</p>
            )}
          </div>
        )}
      </section>

      {/* Histórico de doses */}
      {doses.length > 0 && (
        <section className="bg-[#FFFDF9] rounded-2xl border border-[#E3D5C6] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-[#DAA38F]" />
            <h2 className="font-semibold text-gray-900">Histórico de doses</h2>
          </div>
          <div className="space-y-1.5">
            {doses
              .filter((d) => d.status === "aplicada")
              .sort((a, b) => b.agendadaEm.localeCompare(a.agendadaEm))
              .slice(0, 8)
              .map((d) => {
                const med = medicamentos.find((m) => m.id === d.medicamentoId);
                return (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {med?.nome ?? "Medicamento"}
                      {d.doseMg ? ` · ${d.doseMg}mg` : ""}
                      {d.localAplicacao ? ` · ${d.localAplicacao}` : ""}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {format(parseISO(d.agendadaEm), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {(medicamentos.length > 0 || pesos.length > 0) && (
        <div className="text-center">
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="glp-import-2" />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs text-gray-400 hover:text-[#B57D68] transition-colors inline-flex items-center gap-1.5"
          >
            <Upload size={12} /> Importar outro backup GLP
          </button>
          {importMsg && <p className="text-xs text-[#5F8277] mt-1">{importMsg}</p>}
        </div>
      )}
    </div>
  );
}
