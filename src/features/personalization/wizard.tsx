"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { useTexts } from "@/components/locale-provider";
import { personalCopy } from "./copy";
import { savePersonalDraft, saveTonightDraft } from "./actions";
import { useDraft } from "./use-draft";
import { personalQuestions, tonightQuestions, readAnswer, withAnswer } from "./questions";
import { completePersonal, completeTonight, interests, interestLabels, type PersonalAnswers, type TonightAnswers } from "./model";
import { QuestionInput } from "./question-input";
type Snapshot = { answers: PersonalAnswers | TonightAnswers; step: number; complete: boolean; mode: "quick" | "detailed"; share: boolean };
type Props = { kind: "personal" | "tonight"; initial: Snapshot; version: number; sessionId?: string; revision?: number; profileComplete?: boolean };
export function PreferenceWizard({ kind, initial, version, sessionId, revision, profileComplete = true }: Props) {
  const { locale } = useTexts(), t = personalCopy(locale), router = useRouter();
  const [validation, setValidation] = useState(false);
  const draft = useDraft(initial, version, (value, expected) => kind === "personal"
    ? savePersonalDraft({ answers: value.answers, step: value.step, complete: value.complete, version: expected })
    : saveTonightDraft({ answers: value.answers, step: value.step, complete: value.complete, version: expected, mode: value.mode, share: value.share, sessionId, revision }));
  const d = draft.value;
  const questions = kind === "personal" ? personalQuestions : d.mode === "quick" ? tonightQuestions.slice(0, 5) : tonightQuestions;
  const reviewQuestions = kind === "personal" ? personalQuestions : tonightQuestions;
  const step = Math.min(d.step, questions.length), question = questions[step];
  const done = d.complete && draft.status === "saved";
  const heading = useRef<HTMLHeadingElement>(null);
  const focusKey = question && !done ? question.key : "summary";
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [focusKey]);
  const answer = question ? readAnswer(d.answers, question.key) : undefined;
  const hasAnswer = answer !== undefined && (!Array.isArray(answer) || answer.length > 0);
  function updateAnswer(value: unknown) {
    setValidation(false);
    draft.update({ ...draft.current.current, answers: withAnswer(draft.current.current.answers, question.key, value), complete: false });
  }
  async function move(to: number, skip = false) {
    if (to > step && question && !question.optional && !hasAnswer) { setValidation(true); return; }
    if (!await draft.flush()) return;
    let answers = draft.current.current.answers;
    if (skip && question) answers = withAnswer(answers, question.key, undefined);
    setValidation(false); draft.update({ ...draft.current.current, answers, step: to, complete: false });
  }
  async function finish() {
    const answers = draft.current.current.answers;
    if (!(kind === "personal" ? completePersonal(answers as PersonalAnswers) : completeTonight(answers as TonightAnswers))) { setValidation(true); return; }
    if (!await draft.flush()) return;
    draft.update({ ...draft.current.current, step: questions.length, complete: true });
    if (await draft.flush()) router.refresh();
  }
  async function edit(index: number) {
    if (!await draft.flush()) return;
    draft.update({ ...draft.current.current, mode: kind === "tonight" && index >= 5 ? "detailed" : d.mode, step: index, complete: false });
  }
  return <div className="preference-experience">
    <div className="experience-top"><span className="pill pill-outline"><LockKeyhole size={12} aria-hidden="true" />{kind === "personal" ? "US / 02" : "TONIGHT / 02"}</span><span role="status" className={`save-state ${draft.status}`}>{draft.status === "saved" ? <Check size={14} aria-hidden="true" /> : null}{draft.status === "saved" ? t.saved : draft.status === "saving" ? t.saving : t.unsaved}</span></div>
    <div className="experience-progress" role="progressbar" aria-label={kind === "personal" ? t.profile : t.answers} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={step}><div style={{ width: `${step / questions.length * 100}%` }} /></div>
    {draft.status === "error" || draft.status === "conflict" ? <div className="notice notice-error" role="alert"><p>{t[draft.status]}</p><button className="text-link" onClick={() => draft.status === "conflict" ? location.reload() : void draft.flush()}>{draft.status === "conflict" ? t.reload : t.retry}</button></div> : null}
    {kind === "tonight" && !done && <div className="match-modes" role="group" aria-label={t.answers}>{(["quick", "detailed"] as const).map(mode => <button key={mode} aria-pressed={d.mode === mode} onClick={() => { draft.update({ ...draft.current.current, mode, step: Math.min(step, mode === "quick" ? 5 : 10), complete: false }); }}><strong>{t[mode]}</strong><span>{mode === "quick" ? t.quickHint : t.detailedHint}</span></button>)}</div>}
    {question && !done ? <section className="question-scene" key={question.key} aria-labelledby="focused-question">
      <p className="eyebrow">{String(step + 1).padStart(2, "0")} / {questions.length} {question.optional && <span className="optional-label">{t.optional}</span>}</p>
      <h2 id="focused-question" tabIndex={-1} ref={heading}>{question.title[locale]}</h2>
      <QuestionInput question={question} value={answer} onChange={updateAnswer} locale={locale} />
      {validation && <p className="notice notice-error" role="alert">{t.required}</p>}
      <div className="wizard-controls"><button className="wizard-back" disabled={step === 0} onClick={() => void move(step - 1)}><ArrowLeft size={18} />{t.back}</button><div>{question.optional && <button className="wizard-skip" onClick={() => void move(step + 1, true)}>{t.skip}</button>}<button className="btn btn-primary" disabled={draft.status === "conflict"} onClick={() => void move(step + 1)}>{t.next}<ArrowRight size={18} /></button></div></div>
    </section> : <section className="preference-summary">
      <span className="summary-mark" aria-hidden="true"><Sparkles size={30} /></span><h2 tabIndex={-1} ref={heading}>{kind === "personal" ? t.summary : done ? t.submitted : t.answerTitle}</h2><p className="muted">{kind === "personal" ? t.summaryBody : t.privateTonight}</p>
      {kind === "personal" && <div className="interest-summary">{interests.map((key, index) => <button key={key} className="interest-summary-item" onClick={() => void move(index)}><span>{interestLabels[key][locale]}</span><span className="interest-meter" aria-label={`${(d.answers as PersonalAnswers).ratings[key] ?? 0}/5`}>{[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= ((d.answers as PersonalAnswers).ratings[key] ?? 0) ? "filled" : ""} />)}</span></button>)}</div>}
      <details className="answer-review"><summary>{t.edit}</summary>{reviewQuestions.map((q, index) => { const a = readAnswer(d.answers, q.key); return <div key={q.key}><span>{q.title[locale]}</span><strong>{a === undefined ? t.notAnswered : Array.isArray(a) ? a.map(v => q.options?.find(o => o.value === v)?.label[locale] ?? v).join(", ") || t.notAnswered : q.options?.find(o => o.value === a)?.label[locale] ?? String(a)}</strong><button onClick={() => void edit(index)}>{t.editOne}</button></div>; })}</details>
      {kind === "tonight" && !done && <><label className="reveal-choice"><input type="checkbox" checked={d.share} onChange={e => draft.update({ ...draft.current.current, share: e.target.checked, complete: false })} />{t.reveal}</label><p className="field-hint">{t.revealHint}</p></>}
      {validation && <p className="notice notice-error" role="alert">{t.required}</p>}
      {!done && <button className="btn btn-primary w-full mt-6" disabled={draft.status === "saving" || !profileComplete} onClick={() => void finish()}>{kind === "personal" ? t.finish : t.submit}<Check size={18} /></button>}
      {!profileComplete && <Link className="btn btn-secondary mt-4" href="/preferences">{t.needsProfile}</Link>}
      {done && <Link className="btn btn-secondary w-full mt-6" href={kind === "personal" ? "/home" : `/tonight/${sessionId}?stage=results`}>{kind === "personal" ? t.home : t.results}<ArrowRight size={18} /></Link>}
    </section>}
    <p className="experience-privacy"><LockKeyhole size={13} aria-hidden="true" />{kind === "personal" ? t.private : t.privateTonight}</p>
  </div>;
}
