"use client";

import { Mail, Inbox, RefreshCw, Plus } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useGmail } from "@/lib/hooks/useGmail";
import { Button } from "@/components/ui/Button";

interface GmailInboxProps {
  onImport?: (email: { id: string; from: string; subject: string; date: string; snippet: string }) => Promise<void>;
  compact?: boolean;
  limit?: number;
}

function formatFrom(from: string) {
  const match = from.match(/"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from;
}

export function GmailInbox({ onImport, compact = false, limit = 20 }: GmailInboxProps) {
  const { messages, loading, error, fetchMessages } = useGmail();
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<string | null>(null);

  async function handleImport(id: string) {
    const email = messages.find((m) => m.id === id);
    if (!email || !onImport) return;
    setImporting(id);
    try {
      await onImport(email);
      setImported((prev) => new Set(prev).add(id));
    } finally {
      setImporting(null);
    }
  }

  if (error && error.includes("não conectado")) {
    return (
      <div className="rounded-2xl border border-[#E3D5C6] p-5 text-center bg-[#FFFDF9]">
        <Mail size={24} className="mx-auto text-[#DAA38F] mb-2" />
        <p className="text-sm text-gray-600 mb-3">Conecte o Google para ver seus emails.</p>
        <Link href="/settings" className="text-xs font-medium text-[#B57D68] underline">
          Ir para Configurações
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E3D5C6] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Inbox size={16} className="text-[#5F8277]" />
          <h2 className="font-semibold text-gray-900">Inbox Gmail</h2>
          <span className="text-xs text-gray-400">{messages.length}</span>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#B57D68] transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && messages.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">Carregando emails...</p>
      )}

      {!loading && messages.length === 0 && !error && (
        <p className="text-sm text-gray-500 text-center py-6">Nenhum email recente.</p>
      )}

      {error && !error.includes("não conectado") && (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      )}

      <div className="space-y-1.5">
        {messages.slice(0, limit).map((email) => {
          const done = imported.has(email.id);
          return (
            <div key={email.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-xs font-semibold text-[#9B7D61] truncate">{formatFrom(email.from)}</p>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                {!compact && <p className="text-xs text-gray-500 line-clamp-1">{email.snippet}</p>}
              </div>
              {onImport && (
                <button
                  onClick={() => handleImport(email.id)}
                  disabled={done || importing === email.id}
                  className={`flex-shrink-0 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    done
                      ? "bg-[#E5F0EC] text-[#5F8277]"
                      : "bg-[#DAA38F] text-[#2F2925] hover:bg-[#B57D68]"
                  }`}
                  title={done ? "Já importado" : "Transformar em pendência"}
                >
                  {done ? "✓" : importing === email.id ? "..." : <Plus size={12} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
