"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { MapPin, Clock3, CalendarDays, Zap, ArrowUpRight } from "lucide-react";
import { saveSession } from "@/actions/sessions";
import { localNow } from "@/lib/time";
import { Feedback, SubmitButton } from "./action-form";
import { useTexts } from "./locale-provider";
import type { Tables } from "@/lib/supabase/database.types";
import { updateSharedContext } from "@/features/match/actions";
import { personalCopy } from "@/features/personalization/copy";

export function TonightForm({ timezone, today, defaultStart, session }: { timezone: string; today: string; defaultStart: string; session?: Tables<"activity_sessions"> }) {
  const { t, locale } = useTexts(), p = personalCopy(locale);
  const [state, action] = useActionState(session ? updateSharedContext.bind(null, session.id, session.context_revision) : saveSession, {});
  const [timing, setTiming] = useState(session?.timing ?? "today");
  const [start, setStart] = useState(session?.start_time.slice(0, 5) ?? defaultStart);
  const [end, setEnd] = useState(session?.end_time.slice(0, 5) ?? "23:30");
  const [date, setDate] = useState(session?.activity_date ?? today);
  const [zone, setZone] = useState(timezone);
  function setWhen(value: string) {
    setTiming(value);
    const current = localNow(zone);
    if (value !== "future") setDate(current.date);
    if (value === "now") setStart(current.time);
  }
  return <form action={action} className="tonight-form form-stack">
    <fieldset><legend><span className="step-dot">01</span>{t.when}</legend>
      <div className="segmented">{([{ value: "now", label: t.now, Icon: Zap }, { value: "today", label: t.today, Icon: Clock3 }, { value: "future", label: t.future, Icon: CalendarDays }]).map(({ value, label, Icon }) => <label key={value} className={timing === value ? "selected" : ""}>
        <input type="radio" name="timing" value={value} checked={timing === value} onChange={() => setWhen(value)} /><Icon size={18} aria-hidden="true" />{label}
      </label>)}</div>
    </fieldset>
    <div className="time-grid">
      <label className="field">{t.date}<input type="date" name="activity_date" min={today} value={date} readOnly={timing !== "future"} onChange={(e) => setDate(e.target.value)} required /></label>
      <label className="field">{t.timezone}<input name="timezone" value={zone} list="timezones" onChange={(e) => setZone(e.target.value)} required autoComplete="off" /></label>
      <datalist id="timezones"><option value="Europe/Sofia" /><option value="Europe/London" /><option value="Europe/Berlin" /><option value="America/New_York" /></datalist>
      <label className="field">{t.start}<input type="time" name="start_time" value={start} readOnly={timing === "now"} onChange={(e) => setStart(e.target.value)} required /></label>
      <label className="field">{t.end}<input type="time" name="end_time" value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
    </div>
    {end && start && end < start && <p className="overnight-note"><MoonIcon />{t.overnightHint}</p>}
    <fieldset><legend><span className="step-dot">02</span>{t.location}</legend>
      <div className="location-options">
        <label><input type="radio" name="starting_location" value="sofia" defaultChecked={!session || session.starting_location === "sofia"} /><span className="location-icon"><MapPin size={22} aria-hidden="true" /></span><span><strong>{t.sofia}</strong><small>{t.bulgaria}</small></span><span className="radio-check" /></label>
        <label><input type="radio" name="starting_location" value="chavdar" defaultChecked={session?.starting_location === "chavdar"} /><span className="location-icon"><MapPin size={22} aria-hidden="true" /></span><span><strong>{t.chavdar}</strong><small>{t.bulgaria}</small></span><span className="radio-check" /></label>
      </div><p className="field-hint">{t.locationHint}</p>
    </fieldset>
    {session && <><div className="time-grid">
      <label className="field">{p.transport}<select name="transport" defaultValue={session.transport}>{(["walk", "car", "transit", "bicycle"] as const).map(key => <option key={key} value={key}>{p[key]}</option>)}</select></label>
      <label className="field">{p.travel}<input name="max_travel_minutes" type="number" min={0} max={180} required defaultValue={session.max_travel_minutes} /></label>
      <label className="field">{p.budget}<select name="budget_level" defaultValue={session.budget_level}>{(["free", "low", "medium", "flexible"] as const).map((key, i) => <option key={key} value={i}>{p[key]}</option>)}</select></label>
      <label className="field">{p.environment}<select name="environment" defaultValue={session.environment}>{(["either", "indoor", "outdoor"] as const).map(key => <option key={key} value={key}>{p[key]}</option>)}</select></label>
    </div><p className="field-hint">{p.travelHint} {p.budgetHint}</p><p className="notice notice-info">{p.sharedHint}</p></>}
    <Feedback state={state} /><SubmitButton>{session ? p.saveContext : t.saveSession}</SubmitButton>
    {state.sessionId && <Link className="btn btn-secondary w-full" href={`/tonight/${state.sessionId}`}>{p.openSession}<ArrowUpRight size={18} /></Link>}
    {!session && <p className="field-hint text-center">{t.nextSlice}</p>}
  </form>;
}
function MoonIcon() { return <ArrowUpRight size={16} aria-hidden="true" />; }
