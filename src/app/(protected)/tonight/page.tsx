import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { Temporal } from "@js-temporal/polyfill";
import { requireCouple } from "@/lib/auth";
import { localNow } from "@/lib/time";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Eyebrow } from "@/components/ui";
import { TonightForm } from "@/components/tonight-form";
import { SessionList } from "@/components/session-list";

export default async function TonightPage() {
  const { supabase, profile, coupleId } = await requireCouple();
  const t = await getDictionary();
  const locale = await getLocale();
  const now = Temporal.Now.instant();
  const current = localNow(profile.timezone, now);
  const defaultStart = localNow(profile.timezone, now.add({ minutes: 30 }));
  const sessions = await supabase.from("activity_sessions").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(5);
  if (sessions.error) throw new Error("Unable to load sessions");
  return <><Link href="/home" className="back-link"><ArrowLeft size={16} aria-hidden="true" />{t.home}</Link>
    <div className="tonight-grid"><aside className="tonight-intro"><Eyebrow>{t.tonightEyebrow}</Eyebrow><h1>{t.tonightTitle}</h1><p>{t.tonightBody}</p><div className="tonight-sticker" aria-hidden="true"><Sparkles /><span>LET’S<br />GO <ArrowUpRight size={30} /></span></div><p className="tonight-note">{t.noRecommendations}</p></aside>
      <section className="paper-panel"><TonightForm timezone={profile.timezone} today={current.date} defaultStart={defaultStart.date === current.date ? defaultStart.time : current.time} /></section>
    </div><SessionList sessions={sessions.data} t={t} locale={locale} /></>;
}
