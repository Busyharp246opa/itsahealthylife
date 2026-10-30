"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";
import { useDataAvailable } from "./data-availability";

export function RealtimeConversation({ conversationId }: { conversationId: string }) {
  const available = useDataAvailable();
  const router = useRouter();
  const [state, setState] = useState(available ? "Connecting" : "Offline preview");

  useEffect(() => {
    if (!available) return;
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(`conversation:${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, () => router.refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_attachments", filter: `conversation_id=eq.${conversationId}` }, () => router.refresh())
      .subscribe((status) => setState(status === "SUBSCRIBED" ? "Live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "Reconnecting" : "Connecting"));
    return () => { void supabase.removeChannel(channel); };
  }, [available, conversationId, router]);

  return <span className="fc-realtime-state" role="status"><span aria-hidden />{state}</span>;
}
