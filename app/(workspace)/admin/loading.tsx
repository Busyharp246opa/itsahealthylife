import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return <div className="fc-page fc-admin-page fc-admin-loading" role="status" aria-live="polite">
    <p><LoaderCircle className="fc-spin" size={21} aria-hidden /> Loading administration…</p>
    <div className="fc-admin-loading-bar" />
    <div className="fc-admin-loading-grid"><div /><div /><div /></div>
    <div className="fc-admin-loading-bar fc-admin-loading-bar--short" />
  </div>;
}
