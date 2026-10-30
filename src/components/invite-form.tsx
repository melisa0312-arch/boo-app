"use client";
import { useActionState, useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { issueInvitation } from "@/actions/account";
import { Feedback, SubmitButton } from "./action-form";
import { useTexts } from "./locale-provider";

export function InviteForm() {
  const { t } = useTexts();
  const [state, action] = useActionState(issueInvitation, {});
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(state.invitation!); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  return <div className="form-stack">
    <form action={action} onSubmit={() => { setCopied(false); setCopyError(false); }} className="form-stack"><Feedback state={state} /><SubmitButton>{t.issueInvite}</SubmitButton></form>
    <p className="field-hint">{t.reissueHint}</p>
    {state.invitation && <div className="invitation-result">
      <label htmlFor="invitation-link"><Link2 size={17} aria-hidden="true" />{t.inviteLink}</label>
      <input id="invitation-link" value={state.invitation} readOnly onFocus={(event) => event.currentTarget.select()} />
      <button type="button" className="btn btn-secondary w-full" onClick={copy}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? t.copied : t.copy}</button>
      {copyError && <p role="status" className="field-hint">{t.copyError}</p>}
    </div>}
  </div>;
}
