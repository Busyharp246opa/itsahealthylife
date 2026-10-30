import { LoaderCircle } from "lucide-react";

export default function AuthLoading() {
  return <div className="fc-auth-card fc-auth-loading" role="status"><LoaderCircle className="fc-spin" size={22} aria-hidden /><span>Loading your account…</span></div>;
}
