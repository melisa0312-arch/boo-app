import Link from "next/link";
import { LockKeyhole, ArrowUpRight } from "lucide-react";
import { Header } from "./header";
import { ActionForm } from "./action-form";
import { Eyebrow, OrbitArt } from "./ui";
import { signIn, signUp } from "@/actions/auth";
import { getDictionary } from "@/lib/i18n/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function AuthScreen({ mode, notice }: { mode: "login" | "signup"; notice?: string }) {
  const t = await getDictionary();
  const signup = mode === "signup";
  const configured = Boolean(supabaseConfig());
  const noticeMessage = notice === "confirmation" ? t.confirmError : notice === "invitation" ? t.inviteError : undefined;
  return <><Header /><main id="main" className="page-width auth-grid">
    <aside className="auth-art"><Eyebrow>THE TWO OF US CLUB</Eyebrow><OrbitArt compact /><h2>{t.welcomeAccent}</h2><p>{t.welcomeNote}</p><span className="art-edition">bū. / PRIVATE BY DESIGN</span></aside>
    <section className="auth-panel"><Eyebrow>01 / {signup ? "A NEW BEGINNING" : "WELCOME BACK"}</Eyebrow><h1>{signup ? t.signupTitle : t.authTitle}</h1><p className="muted">{signup ? t.signupBody : t.authBody}</p>
      {!configured && <p className="notice notice-info" role="status">{t.configuration}</p>}
      {noticeMessage && <p className="notice notice-error" role="alert">{noticeMessage}</p>}
      <ActionForm action={signup ? signUp : signIn} submit={signup ? t.signup : t.login} disabled={!configured}>
        <label className="field">{t.email}<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></label>
        <div className="field"><label htmlFor="password">{t.password}</label><input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 10 : 1} maxLength={128} required aria-describedby={signup ? "password-hint" : undefined} />{signup && <small id="password-hint" className="field-hint">{t.passwordHint}</small>}</div>
      </ActionForm>
      <p className="auth-alternative">{signup ? t.haveAccount : t.noAccount} <Link href={signup ? "/login" : "/signup"}>{signup ? t.login : t.signup}<ArrowUpRight size={14} aria-hidden="true" /></Link></p>
      <p className="privacy-note"><LockKeyhole size={14} aria-hidden="true" />{t.private}</p>
    </section>
  </main></>;
}
