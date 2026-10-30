import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Heart, Link2 } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { createCouple, joinCouple } from "@/actions/account";
import { ActionForm } from "@/components/action-form";
import { InviteForm } from "@/components/invite-form";
import { ArrowLink, Eyebrow } from "@/components/ui";

export default async function CouplePage() {
  const { supabase, profile, membership } = await getContext();
  if (!profile.display_name) redirect("/profile");
  const t = await getDictionary();
  const token = (await cookies()).get("bu_invitation")?.value;
  let coupleName = "";
  let count = 0;
  if (membership) {
    const [couple, members] = await Promise.all([
      supabase.from("couples").select("name").eq("id", membership.couple_id).single(),
      supabase.from("couple_members").select("user_id").eq("couple_id", membership.couple_id),
    ]);
    if (couple.error || members.error) throw new Error("Unable to load couple");
    coupleName = couple.data.name; count = members.data.length;
  }
  return <div className="onboarding-grid"><aside className="onboarding-copy"><Eyebrow>THE TWO OF US CLUB / 02</Eyebrow><h1>{t.coupleTitle}</h1><p>{t.coupleBody}</p><div className="couple-art" aria-hidden="true"><span>YOU</span><Heart /><span>ME</span></div></aside>
    <section className="paper-panel">
      {membership ? <><span className="pill pill-lime"><Heart size={13} aria-hidden="true" />{count === 2 ? t.connected : t.waiting}</span><h2 className="panel-title">{coupleName}</h2>
        {count < 2 && <><h3>{t.inviteTitle}</h3><p className="muted">{t.inviteBody}</p><InviteForm /></>}
        <ArrowLink href="/home" secondary className="mt-6 w-full">{t.continueHome}</ArrowLink>
      </> : <>
        {!token && <><ActionForm action={createCouple} submit={t.createCouple}><label className="field">{t.coupleName}<input name="name" maxLength={60} required placeholder="bū." /></label></ActionForm><div className="form-divider">{t.or}</div></>}
        <div className="panel-subheading"><Link2 size={19} aria-hidden="true" /><h2>{t.joinCouple}</h2></div>
        <ActionForm action={joinCouple} submit={t.joinCouple}><label className="field">{t.inviteCode}<input name="token" defaultValue={token ?? ""} required pattern="[a-f0-9]{64}" minLength={64} maxLength={64} autoComplete="off" spellCheck={false} /></label></ActionForm>
        {token && <p className="field-hint">{t.inviteBody}</p>}
      </>}
    </section></div>;
}
