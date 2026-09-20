"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Mail, Unplug } from "lucide-react";

export function GoogleIntegrations() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    const response = await fetch("/api/google/status");
    if (response.ok) setConnected((await response.json()).connected);
    setLoading(false);
  }

  useEffect(() => { loadStatus(); }, []);

  async function disconnect() {
    setLoading(true);
    await fetch("/api/google/disconnect", { method: "POST" });
    setConnected(false);
    setLoading(false);
  }

  return (
    <section className="bg-white rounded-2xl border border-[#E3D5C6] p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Integrações Google</h2>
        <p className="text-sm text-gray-600 mt-1">Leia sua agenda e emails sem alterar nada no Google.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-[#E3D5C6] p-3">
          <CalendarDays className="text-[#5F8277]" size={20} />
          <div><p className="text-sm font-medium text-gray-900">Google Calendar</p><p className="text-xs text-gray-500">Somente leitura</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E3D5C6] p-3">
          <Mail className="text-[#5F8277]" size={20} />
          <div><p className="text-sm font-medium text-gray-900">Gmail</p><p className="text-xs text-gray-500">Leitura e pendências</p></div>
        </div>
      </div>
      {!loading && !connected && (
        <a href="/api/google/auth" className="inline-flex items-center justify-center rounded-xl bg-[#DAA38F] px-4 py-2.5 text-sm font-semibold text-[#2F2925] hover:bg-[#B57D68] transition-colors">
          Conectar Google
        </a>
      )}
      {!loading && connected && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#5F8277]">Google conectado</p>
          <button onClick={disconnect} className="inline-flex items-center gap-2 rounded-xl border border-[#D8C5B5] px-3 py-2 text-sm text-gray-700 hover:bg-[#F2E8DD]">
            <Unplug size={15} /> Desconectar
          </button>
        </div>
      )}
    </section>
  );
}
