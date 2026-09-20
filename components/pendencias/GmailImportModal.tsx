"use client";

import { useEffect, useState } from "react";
import { X, Mail, Check, Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

interface GmailImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (email: GmailMessage) => Promise<void>;
}

function formatFrom(from: string) {
  const match = from.match(/"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from;
}

export function GmailImportModal({ isOpen, onClose, onImport }: GmailImportModalProps) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setImported(new Set());
    fetch("/api/google/gmail")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Erro ao carregar emails");
        setMessages(d.messages ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleImport(email: GmailMessage) {
    setImporting(email.id);
    try {
      await onImport(email);
      setImported((prev) => new Set(prev).add(email.id));
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 px-4 pb-4 md:pb-0">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Mail size={18} className="text-[#5F8277]" /> Importar do Gmail
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-sm text-gray-500 text-center py-8">Carregando emails...</p>}
          {error && (
            <div className="text-sm text-center py-8 space-y-2">
              <p className="text-red-500">{error}</p>
              {error.includes("não conectado") && (
                <p className="text-xs text-gray-500">
                  Conecte o Google em <a href="/settings" className="text-[#B57D68] underline">Configurações</a> primeiro.
                </p>
              )}
            </div>
          )}
          {!loading && !error && messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Inbox size={32} className="mx-auto text-gray-300" />
              <p className="text-sm text-gray-500">Nenhum email encontrado.</p>
            </div>
          )}
          {messages.map((email) => {
            const done = imported.has(email.id);
            return (
              <div key={email.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                  <p className="text-xs text-gray-500 truncate">{formatFrom(email.from)} · {email.snippet}</p>
                </div>
                <button
                  onClick={() => handleImport(email)}
                  disabled={done || importing === email.id}
                  className={cn(
                    "flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                    done
                      ? "bg-[#E5F0EC] text-[#5F8277]"
                      : "bg-[#DAA38F] text-[#2F2925] hover:bg-[#B57D68] disabled:opacity-50"
                  )}
                >
                  {done ? <><Check size={12} className="inline" /> Importado</> : importing === email.id ? "..." : "Importar"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
