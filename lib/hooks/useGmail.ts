"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

export function useGmail() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/google/gmail");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erro ao carregar emails");
      setMessages(d.messages ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  return { messages, loading, error, fetchMessages };
}
