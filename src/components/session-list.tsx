import { MapPin, ArrowUpRight, MoonStar } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/database.types";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

export function SessionList({ sessions, t, locale }: { sessions: Tables<"activity_sessions">[]; t: Dictionary; locale: Locale }) {
  return <section className="session-section" aria-labelledby="saved-sessions">
    <div className="section-heading"><h2 id="saved-sessions">{t.sessionCount}</h2><MoonStar size={24} aria-hidden="true" /></div>
    {!sessions.length ? <div className="empty-state"><div className="empty-orbit" aria-hidden="true"><ArrowUpRight size={28} /></div><p>{t.emptySessions}</p></div> : <div className="session-list">{sessions.map((session) => <article key={session.id} className="session-card">
      <div className="session-date"><span>{new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone: "UTC" }).format(new Date(`${session.activity_date}T12:00:00Z`))}</span><small>{new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${session.activity_date}T12:00:00Z`))}</small></div>
      <div className="session-detail"><span className="pill pill-lime">{t.draft}</span><h3>{session.start_time.slice(0, 5)} <span aria-hidden="true">—</span> {session.end_time.slice(0, 5)} {session.ends_next_day && <small>+1 · {t.nextDay}</small>}</h3>
        <p><MapPin size={14} aria-hidden="true" />{session.starting_location === "sofia" ? t.sofia : t.chavdar} · {session.timezone}</p>
      </div><Link className="session-arrow" href={`/tonight/${session.id}`} aria-label={`${t.tonight} ${session.activity_date}`}><ArrowUpRight size={22} aria-hidden="true" /></Link>
    </article>)}</div>}
  </section>;
}
