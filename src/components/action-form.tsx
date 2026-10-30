"use client";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, ArrowUpRight } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { useTexts } from "./locale-provider";

export type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;
export function SubmitButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const { t } = useTexts();
  return <button type="submit" className="btn btn-primary w-full" disabled={pending || disabled} aria-busy={pending}>
    {pending ? <><LoaderCircle size={19} className="animate-spin" aria-hidden="true" />{t.pending}</> : <>{children}<ArrowUpRight size={19} aria-hidden="true" /></>}
  </button>;
}
export function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <div className="notice notice-error" role="alert">{state.error}</div>;
  if (state.success) return <div className="notice notice-success" role="status">{state.success}</div>;
  return null;
}
export function ActionForm({ action, children, submit, disabled, className = "" }: { action: FormAction; children: ReactNode; submit: string; disabled?: boolean; className?: string }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className={`form-stack ${className}`}>
    {children}<Feedback state={state} /><SubmitButton disabled={disabled}>{submit}</SubmitButton>
  </form>;
}
