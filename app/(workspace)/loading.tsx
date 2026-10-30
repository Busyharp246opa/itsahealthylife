import { LoaderCircle } from "lucide-react";

export default function WorkspaceLoading() {
  return <div className="fc-page fc-loading-page" aria-label="Loading page"><p role="status"><LoaderCircle className="fc-spin" size={20} aria-hidden /> Loading your page…</p><div aria-hidden /><div aria-hidden /><div aria-hidden /></div>;
}
