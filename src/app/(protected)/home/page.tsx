import Link from "next/link";
import { ArrowUpRight, Compass, CalendarDays, Heart, Fingerprint, Sparkles } from "lucide-react";
import { requireCouple } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { ArrowLink, Eyebrow, OrbitArt } from "@/components/ui";
import { SessionList } from "@/components/session-list";

export default async function HomePage() {
  const { supabase, profile, coupleId } = await requireCouple();
  const t = await getDictionary();
  const locale = await getLocale();
  const [sessions, partner] = await Promise.all([
    supabase.from("activity_sessions").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(5),
    supabase.rpc("get_partner_name"),
  ]);
  if (sessions.error || partner.error) throw new Error("Unable to load your world");
  return <>
    <section className="home-intro"><div><Eyebrow><span className="status-dot" />{t.greeting}, {profile.display_name} + {partner.data || t.partner}</Eyebrow><h1>{t.homeTitle}<br /><span>{t.homeAccent}</span></h1></div><p>{t.homeBody}</p></section>
    {!partner.data && <Link href="/couple" className="partner-banner"><Heart size={17} aria-hidden="true" />{t.waiting}<span>{t.issueInvite} <ArrowUpRight size={16} aria-hidden="true" /></span></Link>}
    <section className="adventure-hero"><div className="adventure-copy"><Eyebrow><Sparkles size={16} aria-hidden="true" />{t.heroEyebrow}</Eyebrow><h2>{t.heroTitle}</h2><p>{t.heroBody}</p><ArrowLink href="/tonight">{t.adventure}</ArrowLink></div><OrbitArt compact /><span className="hero-footnote" aria-hidden="true">YOU + ME + A LITTLE POSSIBILITY</span></section>
    <section className="world-section" aria-labelledby="four-worlds"><Eyebrow><span id="four-worlds">{t.fourWorlds}</span></Eyebrow><div className="world-grid">
      <article className="world-card world-now"><div className="world-card-top"><Compass size={27} aria-hidden="true" /><span>01</span></div><h2>{t.nowTitle}<ArrowUpRight size={25} aria-hidden="true" /></h2><p>{t.nowBody}</p><Link href="/tonight">{t.available}<ArrowUpRight size={17} aria-hidden="true" /></Link></article>
      <article className="world-card world-plans"><div className="world-card-top"><CalendarDays size={27} aria-hidden="true" /><span>02</span></div><h2>{t.plansTitle}</h2><p>{t.plansBody}</p><span className="pill pill-outline">{t.later}</span></article>
      <article className="world-card world-ours"><div className="world-card-top"><Heart size={27} aria-hidden="true" /><span>03</span></div><h2>{t.worldTitle}</h2><p>{t.worldBody}</p><span className="pill pill-outline">{t.later}</span></article>
      <article className="world-card world-us"><div className="world-card-top"><Fingerprint size={27} aria-hidden="true" /><span>04</span></div><h2>{t.usTitle}</h2><p>{t.usBody}</p><Link href="/profile">{t.editProfile}<ArrowUpRight size={17} aria-hidden="true" /></Link></article>
    </div></section>
    <SessionList sessions={sessions.data} t={t} locale={locale} />
    <footer className="site-footer"><span>bū.</span><p>{t.footer}</p><Heart size={17} aria-hidden="true" /></footer>
  </>;
}
