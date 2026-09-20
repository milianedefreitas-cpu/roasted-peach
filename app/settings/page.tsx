"use client";

import { Info, LogOut, Trash2, AlertTriangle, Download, Upload, CheckCircle2, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Cloud } from "lucide-react";
import { GoogleIntegrations } from "@/components/settings/GoogleIntegrations";

function ConfirmModal({ title, description, onConfirm, onCancel, loading }: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? "Apagando..." : "Sim, apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TABLES = [
  "tasks",
  "pendencias",
  "metas",
  "meta_checks",
  "projetos",
  "projeto_tasks",
  "insights",
  "estudos",
  "anotacoes_espirituais",
  "pedidos_oracao",
  "versiculos_salvos",
  "leitura_biblica",
  "estudo_estacoes",
  "content_refs",
] as const;

type TableName = typeof TABLES[number];

async function exportAllData() {
  const backup: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const { data } = await supabase.from(table).select("*");
    backup[table] = data ?? [];
  }
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split("T")[0];
  const a = document.createElement("a");
  a.href = url;
  a.download = `planner-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importAllData(
  file: File,
  onProgress: (msg: string) => void
): Promise<{ imported: number; errors: string[] }> {
  const text = await file.text();
  const backup = JSON.parse(text) as Record<string, unknown[]>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticada");

  let imported = 0;
  const errors: string[] = [];

  for (const table of TABLES) {
    const rows = backup[table as TableName];
    if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

    onProgress(`Restaurando ${table} (${rows.length} registros)...`);

    // Strip id so we don't conflict, and force user_id to current user
    const sanitized = rows.map((row) => {
      const r = { ...(row as Record<string, unknown>) };
      delete r.id;
      delete r.created_at;
      delete r.updated_at;
      if ("user_id" in r) r.user_id = user.id;
      return r;
    });

    // Insert in chunks of 100 to avoid payload limits
    const chunkSize = 100;
    for (let i = 0; i < sanitized.length; i += chunkSize) {
      const chunk = sanitized.slice(i, i + chunkSize);
      const { error } = await supabase.from(table).insert(chunk);
      if (error) {
        errors.push(`${table}: ${error.message}`);
      } else {
        imported += chunk.length;
      }
    }
  }

  return { imported, errors };
}

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function clearAll() {
    setClearing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setClearing(false); return; }
    await Promise.all([
      supabase.from("tasks").delete().eq("user_id", user.id),
      supabase.from("pendencias").delete().eq("user_id", user.id),
      supabase.from("meta_checks").delete().eq("user_id", user.id),
      supabase.from("dieta_checkins").delete().eq("user_id", user.id),
    ]);
    setClearing(false);
    setShowConfirm(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportAllData();
      setExported(true);
      setTimeout(() => setExported(false), 4000);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    setImportProgress("Lendo arquivo...");
    setImportResult(null);

    try {
      const result = await importAllData(file, setImportProgress);
      setImportResult(result);
    } catch (err) {
      setImportResult({ imported: 0, errors: [(err as Error).message] });
    } finally {
      setImporting(false);
      setImportProgress("");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-2">
      <h1 className="text-xl font-bold text-gray-900 md:block hidden">Configurações</h1>

      {showConfirm && (
        <ConfirmModal
          title="Limpar dados do planner"
          description="Isso vai apagar todas as tarefas, pendências, check-ins de metas e registros de dieta. Os planos de refeição, metas, insights, estudos e projetos serão mantidos. Essa ação não pode ser desfeita."
          onConfirm={clearAll}
          onCancel={() => setShowConfirm(false)}
          loading={clearing}
        />
      )}

      <GoogleIntegrations />

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Info size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Roasted Peach</p>
              <p className="text-xs text-gray-400">Versão 2.0 — dados na nuvem com Supabase</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <Cloud size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Sincronização ativa</p>
              <p className="text-xs text-gray-400">Seus dados ficam salvos e sincronizados em todos os dispositivos</p>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="px-5 py-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Exportar todos os dados</p>
              <p className="text-xs text-gray-400">
                Baixa um arquivo JSON com tudo: tarefas, pendências, metas, projetos, insights, estudos, espiritualidade e muito mais.
              </p>
            </div>
          </div>
          {exported && (
            <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-2">
              <CheckCircle2 size={14} /> Arquivo baixado com sucesso!
            </div>
          )}
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? "Exportando..." : "Baixar backup completo"}
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Backup automático também roda toda semana via GitHub Actions.
          </p>
        </div>

        {/* Import */}
        <div className="px-5 py-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload size={18} className="text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Importar backup</p>
              <p className="text-xs text-gray-400">
                Restaura todos os dados a partir de um arquivo de backup exportado anteriormente. Os dados existentes não são apagados — os do backup são adicionados.
              </p>
            </div>
          </div>

          {importing && (
            <div className="flex items-center gap-2 text-xs text-violet-600 font-medium mb-2">
              <RotateCcw size={13} className="animate-spin" /> {importProgress}
            </div>
          )}

          {importResult && (
            <div className={`rounded-xl px-4 py-3 mb-3 text-xs ${importResult.errors.length === 0 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
              {importResult.errors.length === 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{importResult.imported} registros restaurados com sucesso!</span>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-1">{importResult.imported} registros importados, {importResult.errors.length} erro(s):</p>
                  {importResult.errors.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
          >
            <Upload size={14} />
            {importing ? "Importando..." : "Selecionar arquivo de backup"}
          </Button>
        </div>

        {/* Clear */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Limpar registros do dia a dia</p>
              <p className="text-xs text-gray-400">Remove tarefas, pendências, check-ins e registros de dieta. Mantém metas, insights, estudos e projetos.</p>
            </div>
          </div>
          {done && <p className="text-xs text-green-600 font-medium mb-2">Dados limpos com sucesso.</p>}
          <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
            Limpar registros
          </Button>
        </div>

        <div className="px-5 py-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>
      </div>

      <div className="bg-purple-50 rounded-2xl p-5">
        <p className="text-sm font-semibold text-purple-900 mb-1">Instalar como app</p>
        <p className="text-xs text-purple-700">
          No celular, abra o menu do navegador e toque em "Adicionar à tela inicial" para instalar o Planner como um app nativo.
        </p>
      </div>
    </div>
  );
}
