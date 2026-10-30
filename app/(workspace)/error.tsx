"use client";

import { AlertTriangle } from "lucide-react";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="fc-page"><div className="fc-error-state"><AlertTriangle size={28} aria-hidden /><h1>Something went wrong.</h1><p>Check that Supabase is running on port 56321, then retry this route.</p><button type="button" className="fc-button fc-button--primary" onClick={reset}>Try again</button></div></div>;
}
