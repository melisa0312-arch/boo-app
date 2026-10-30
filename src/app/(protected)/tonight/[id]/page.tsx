import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireCouple } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { localNow } from "@/lib/time";
import { TonightForm } from "@/components/tonight-form";
import { personalCopy } from "@/features/personalization/copy";
import { personalSchema, tonightSchema, suggestions } from "@/features/personalization/model";
import { PreferenceWizard } from "@/features/personalization/wizard";
import { MatchRefresh } from "@/features/match/progress";
import { MatchResults, SharedProgress } from "@/features/match/results";
export default async function SessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ stage?: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase, user, coupleId } = await requireCouple();
  const locale = await getLocale(), t = personalCopy(locale);
  const [session, pref, response, progress, latest] = await Promise.all([
    supabase.from("activity_sessions").select("*").eq("id", id).eq("couple_id", coupleId).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
    supabase.from("tonight_responses").select("*").eq("session_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.rpc("tonight_progress", { p_session: id }),
    supabase.from("match_results").select("*").eq("session_id", id).order("iteration", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!session.data) notFound();
  if (session.error || pref.error || response.error || progress.error || latest.error) throw new Error("Unable to load evening");
  const s = session.data, r = response.data;
  const { stage: requested } = await searchParams;
  const stage = !s.context_completed ? "context" : requested === "context" ? "context" : requested === "results" || (!requested && r?.submitted_at) ? "results" : "answers";
  const initialAnswers = r ? tonightSchema.parse(r.answers) : suggestions(personalSchema.parse(pref.data.answers));
  const now = localNow(s.timezone);
  return <><MatchRefresh /><nav className="session-stages" aria-label="Tonight"><Link href="/home">bū.</Link>{(["context", "answers", "results"] as const).map((key, i) => <Link key={key} href={`/tonight/${id}?stage=${key}`} aria-current={stage === key ? "step" : undefined}><span>0{i + 1}</span>{t[key]}</Link>)}</nav>
    <div className="shared-context-strip"><span>{s.activity_date}</span><strong>{s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}{s.ends_next_day ? " (+1)" : ""}</strong><span>{s.starting_location === "sofia" ? (locale === "bg" ? "София" : "Sofia") : (locale === "bg" ? "Чавдар" : "Chavdar")} · {s.timezone}</span></div>
    <SharedProgress raw={progress.data} userId={user.id} locale={locale} />
    {stage === "context" ? <div className="tonight-grid"><aside className="tonight-intro"><p className="eyebrow">TONIGHT / 01</p><h1>{t.context}</h1><p>{t.sharedHint}</p></aside><section className="paper-panel"><TonightForm key={s.context_revision} session={s} timezone={s.timezone} today={now.date} defaultStart={s.start_time.slice(0, 5)} /></section></div>
      : stage === "answers" ? <div className="personalization-layout"><aside className="personalization-intro"><p className="eyebrow">TONIGHT / 02</p><h1>{t.answerTitle}</h1><p>{t.privateTonight}</p><p className="field-hint mt-6">{t.revealHint}</p>{r && !r.submitted_at && latest.data?.stale && <p className="notice notice-info mt-6">{t.stale}</p>}</aside><PreferenceWizard key={`${s.context_revision}:${r?.submitted_at ? "ready" : "draft"}`} kind="tonight" sessionId={id} revision={s.context_revision} version={r?.version ?? 0} profileComplete={Boolean(pref.data.completed_at)} initial={{ answers: initialAnswers, step: r?.current_step ?? 0, complete: Boolean(r?.submitted_at), mode: r?.mode === "detailed" ? "detailed" : "quick", share: r?.share_answers ?? false }} /></div>
      : <><h1 className="sr-only">{t.results}</h1><MatchResults session={s} result={latest.data} progress={progress.data} locale={locale} /></>}
  </>;
}
