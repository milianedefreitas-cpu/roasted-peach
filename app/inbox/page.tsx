"use client";

import { Inbox } from "lucide-react";
import { GmailInbox } from "@/components/gmail/GmailInbox";
import { usePendencias } from "@/lib/hooks/usePendencias";

export default function InboxPage() {
  const { createPendencia } = usePendencias({});

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      <h1 className="text-xl font-bold text-gray-900 md:block hidden">Inbox</h1>
      <p className="text-sm text-gray-500">Últimos 20 emails. Clique no + para transformar em pendência.</p>
      <GmailInbox
        onImport={async (email) => {
          await createPendencia({
            title: email.subject,
            description: `De: ${email.from}\n\n${email.snippet}`,
            estimatedMinutes: 30,
            category: "Pessoal",
            priority: "Média",
            status: "Aberta",
          });
        }}
      />
    </div>
  );
}
