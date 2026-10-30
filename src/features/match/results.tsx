import Link from "next/link";
import { ArrowUpRight, Check, Clock3, Heart, LockKeyhole, Sparkles } from "lucide-react";
import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Tables } from "@/lib/supabase/database.types";
import { catalog } from "./catalog";
import { personalCopy } from "../personalization/copy";
import { tonightSchema } from "../personalization/model";
import { tonightQuestions, readAnswer } from "../personalization/questions";
import { matchAction } from "./actions";
export const progressSchema = z.array(z.object({ user_id: z.uuid(), display_name: z.string().nullable(), ready: z.boolean(), step: z.number(), has_profile: z.boolean(), revealed_answers: tonightSchema.nullable() }));
const recommendationsSchema = z.array(z.object({ concept_id: z.string(), reasons: z.array(z.string()) }));
export function SharedProgress({ raw, userId, locale }: { raw: unknown; userId: string; locale: Locale }) {
  const people = progressSchema.parse(raw), t = personalCopy(locale);
  return <section className="shared-progress" aria-label={t.shared}><div className="readiness-people">{people.map(person => <div className={person.ready ? "is-ready" : ""} key={person.user_id}><span className="person-bubble" aria-hidden="true">{person.ready ? <Check size={21} /> : <Heart size={21} />}</span><span><strong>{person.display_name ?? "BŪ"}</strong><small>{person.ready ? t.ready : t.working}</small></span></div>)}{people.length < 2 && <div><span className="person-bubble waiting-bubble" aria-hidden="true">?</span><span><strong>BŪ</strong><small>{t.waiting}</small></span></div>}</div>
    {people.filter(p => p.user_id !== userId && p.revealed_answers).map(person => <details className="revealed-answers" key={person.user_id}><summary>{t.partnerRevealed}</summary>{tonightQuestions.map(q => { const answer = readAnswer(person.revealed_answers!, q.key); if (answer === undefined) return null; return <p key={q.key}><strong>{q.title[locale]}: </strong>{Array.isArray(answer) ? answer.map(v => q.options?.find(o => o.value === v)?.label[locale] ?? v).join(", ") : q.options?.find(o => o.value === answer)?.label[locale] ?? String(answer)}</p>; })}</details>)}
  </section>;
}
export function MatchResults({ session, result, progress, locale }: { session: Tables<"activity_sessions">; result: Tables<"match_results"> | null; progress: unknown; locale: Locale }) {
  const t = personalCopy(locale), people = progressSchema.parse(progress);
  const ready = people.length === 2 && people.every(p => p.ready && p.has_profile);
  const recommendations = result && !result.stale ? recommendationsSchema.parse(result.recommendations).map(r => catalog.find(c => c.id === r.concept_id)).filter(c => c !== undefined) : [];
  const top = recommendations[0];
  if (!ready || !result || result.stale) return <section className="match-waiting"><div className="waiting-art" aria-hidden="true"><Heart /><Sparkles /></div><h2>{ready ? t.createMatch : t.waiting}</h2><p>{result?.stale ? t.stale : t.waitingBody}</p><ActionForm action={matchAction.bind(null, session.id, "calculate")} submit={t.createMatch} disabled={!ready}>
    <p className="field-hint">{t.privacySummary}</p></ActionForm><Link href={`/tonight/${session.id}?stage=answers`} className="text-link">{t.edit}</Link></section>;
  if (!top) return <section className="match-waiting"><h2>{t.noMatch}</h2><p>{t.noMatchBody}</p><Link href={`/tonight/${session.id}?stage=context`} className="btn btn-secondary">{t.context}<ArrowUpRight size={18} /></Link></section>;
  const available = Math.floor((Date.parse(session.ends_at) - Date.parse(session.starts_at)) / 60000) - session.max_travel_minutes * 2;
  return <div className="match-results"><div className="match-result-intro"><p className="eyebrow">{t.catalog}</p><h2>{t.matched}</h2></div>
    <article className="top-match"><div className="top-match-art" aria-hidden="true"><Sparkles /><span>YOU<br />+ ME</span></div><div className="top-match-copy"><p className="eyebrow">{t.top}</p><h3>{top.title[locale]}</h3><p>{top.description[locale]}</p><div className="concept-meta"><span><Clock3 size={16} />~{top.duration} {t.minutes}</span><span>{t[(["free", "low", "medium", "flexible"] as const)[top.cost]]}</span></div>
      <ActionForm action={matchAction.bind(null, session.id, "select")} submit={session.selected_concept_id === top.id ? t.planSaved : t.savePlan}><input type="hidden" name="result" value={result.id} /><input type="hidden" name="concept" value={top.id} /></ActionForm>
    </div></article>
    <div className="match-explanation"><h3>{t.why}</h3><p>{t.whyBody}</p><div><span>{t.activityTime}: {available} {t.minutes}</span><span>{t.reserve}: {session.max_travel_minutes * 2} {t.minutes}</span></div><small><LockKeyhole size={13} />{t.privacySummary}</small></div>
    <h3 className="alternatives-heading">{t.alternatives}</h3><div className="alternative-grid">{recommendations.slice(1).map((concept, i) => <article key={concept.id}><span className="eyebrow">0{i + 2} /</span><h4>{concept.title[locale]}</h4><p>~{concept.duration} {t.minutes}</p><ActionForm action={matchAction.bind(null, session.id, "select")} submit={session.selected_concept_id === concept.id ? t.planSaved : t.savePlan}><input type="hidden" name="result" value={result.id} /><input type="hidden" name="concept" value={concept.id} /></ActionForm></article>)}</div>
    {recommendations.length < 4 && <p className="field-hint mt-4">{t.fewer}</p>}
    <section className="reroll-panel"><h3>{t.reroll}</h3><ActionForm action={matchAction.bind(null, session.id, "feedback")} submit={t.reroll}><label className="field">{t.feedback}<select name="reason">{(["not_tonight", "too_active", "too_familiar", "not_interested"] as const).map(reason => <option key={reason} value={reason}>{t[reason]}</option>)}</select></label><label className="field">{t.top}<select name="concept">{recommendations.map(c => <option key={c.id} value={c.id}>{c.title[locale]}</option>)}</select></label><p className="field-hint">{t.vetoHint}</p></ActionForm></section>
    <p className="catalog-disclaimer">{t.catalogHint}</p>
  </div>;
}
