import Link from "next/link";
import Image from "next/image";
export default function AuthLayout({ children }: { children: React.ReactNode }) { return <div className="fc-auth-page"><header><Link href="/" className="fc-auth-logo" aria-label="It’s A Healthy Life home"><Image src="/brand/healthy-life-mark.png" width={43} height={29} alt="" /><span className="fc-brand-name">IT’S A<br />HEALTHY LIFE</span></Link><Link href="/trainee">Explore Healthy Life</Link></header><main>{children}</main><footer>It’s A Healthy Life · Move, nourish, connect, grow.</footer></div>; }
