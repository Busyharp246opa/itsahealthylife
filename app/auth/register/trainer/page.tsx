import Link from "next/link";
import { RegistrationForm } from "../../auth-forms";
export const metadata = { title: "Trainer application" };
export default function Page() { return <div className="fc-auth-card"><p className="fc-auth-eyebrow">Trainer application</p><h1>Coach with Healthy Life.</h1><p>Tell us about your practice. Certificates are optional; an admin reviews every application.</p><RegistrationForm role="trainer" /><p className="fc-auth-alt">Already applied? <Link href="/auth/login">Sign in</Link> · <Link href="/auth/register/trainee">Join as a trainee</Link></p></div>; }
