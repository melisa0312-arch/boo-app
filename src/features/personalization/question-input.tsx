"use client";
import { Check } from "lucide-react";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Question } from "./questions";
import { personalCopy } from "./copy";
export function QuestionInput({ question: q, value, onChange, locale }: { question: Question; value: unknown; onChange: (value: unknown) => void; locale: Locale }) {
  const t = personalCopy(locale);
  if (q.kind === "rating" && !q.key.startsWith("ratings.")) return <div className="preference-slider"><label htmlFor={q.key} className="sr-only">{q.title[locale]}</label><output htmlFor={q.key}>{typeof value === "number" ? value : "—"}<small>/ 5</small></output><input id={q.key} type="range" min={1} max={5} step={1} value={typeof value === "number" ? value : 3} onChange={e => onChange(Number(e.target.value))} /><div className="scale-ends"><span>{q.low?.[locale]}</span><span>{q.high?.[locale]}</span></div></div>;
  if (q.kind === "rating") return <fieldset className="rating-field"><legend className="sr-only">{q.title[locale]}</legend><div className="rating-buttons">{[1, 2, 3, 4, 5].map(n => <label key={n} className={value === n ? "chosen" : ""}><input type="radio" name={q.key} value={n} checked={value === n} onChange={() => onChange(n)} /><span>{n}</span></label>)}</div><div className="scale-ends"><span>{q.low?.[locale]}</span><span>{q.high?.[locale]}</span></div></fieldset>;
  if (q.kind === "text") return <div className="field"><label className="sr-only" htmlFor={q.key}>{q.title[locale]}</label><textarea id={q.key} maxLength={1000} rows={5} value={typeof value === "string" ? value : ""} onChange={e => onChange(e.target.value)} aria-describedby="note-hint" /><p id="note-hint" className="field-hint">{t.textHint}</p></div>;
  const selected = Array.isArray(value) ? value as string[] : [];
  return <fieldset><legend className="sr-only">{q.title[locale]}</legend><div className="answer-options">{q.options?.map(option => {
    const checked = q.kind === "multi" ? selected.includes(option.value) : value === option.value;
    return <label className={checked ? "chosen" : ""} key={option.value}><input type={q.kind === "multi" ? "checkbox" : "radio"} name={q.key} checked={checked} onChange={() => onChange(q.kind === "multi" ? checked ? selected.filter(v => v !== option.value) : [...selected, option.value] : option.value)} /><span>{option.label[locale]}</span><span className="option-tick" aria-hidden="true">{checked && <Check size={15} />}</span></label>;
  })}</div>{["limitation_tags", "restriction_tags", "excluded_interests", "avoid_interests"].includes(q.key) && <p className="field-hint mt-3">{t.limitHint}</p>}</fieldset>;
}
