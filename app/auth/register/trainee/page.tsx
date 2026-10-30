import Link from "next/link";
import { RegistrationForm } from "../../auth-forms";
export const metadata = { title: "Create trainee account" };
export default function Page() { return <div className="fc-auth-card"><p className="fc-auth-eyebrow">Trainee account</p><h1>Make progress your own.</h1><p>Save your training, meals, and wellness details. Choose coaching now or later.</p><RegistrationForm role="trainee" /><p className="fc-auth-alt">Already registered? <Link href="/auth/login">Sign in</Link> · <Link href="/auth/register/trainer">Apply as a trainer</Link></p></div>; }
