import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function Brand() { return <Link href="/" className="brand" aria-label="bū. — Home">bū<span>.</span></Link>; }
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}
export function ArrowLink({ href, children, secondary = false, className = "" }: { href: string; children: ReactNode; secondary?: boolean; className?: string }) {
  return <Link href={href} className={`btn ${secondary ? "btn-secondary" : "btn-primary"} ${className}`}>{children}<ArrowUpRight size={20} aria-hidden="true" /></Link>;
}
export function OrbitArt({ compact = false }: { compact?: boolean }) {
  return <div className={`orbit-art ${compact ? "orbit-compact" : ""}`} aria-hidden="true">
    <div className="orbit-line orbit-line-one" /><div className="orbit-line orbit-line-two" />
    <div className="art-sun"><Sparkles strokeWidth={1.3} /></div>
    <div className="art-dot" /><div className="art-spark"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round"><path d="M50 8v84M8 50h84M20 20l60 60M20 80l60-60" /></svg></div>
    <div className="art-letter art-letter-one">b</div><div className="art-letter art-letter-two">ū</div>
    <div className="art-ticket"><span>YOU + ME</span><span><ArrowUpRight size={25} /></span><span>ANYWHERE</span></div>
  </div>;
}
