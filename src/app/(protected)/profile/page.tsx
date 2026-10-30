import Link from "next/link";
import { UserRound, ArrowLeft, ArrowUpRight, Heart } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { saveProfile } from "@/actions/account";
import { ActionForm } from "@/components/action-form";
import { Eyebrow } from "@/components/ui";

export default async function ProfilePage() {
  const { profile, membership } = await getContext();
  const t = await getDictionary();
  const locale = await getLocale();
  return <div className="onboarding-grid"><aside className="onboarding-copy"><Eyebrow>US / 01</Eyebrow><h1>{t.profileTitle}</h1><p>{t.profileBody}</p><div className="profile-art" aria-hidden="true"><UserRound /><span>100%<br />YOU.</span><Heart /></div></aside>
    <section className="paper-panel"><ActionForm action={saveProfile} submit={t.saveProfile}>
      <label className="field">{t.name}<input name="display_name" autoComplete="given-name" maxLength={60} required defaultValue={profile.display_name ?? ""} /></label>
      <label className="field">{t.language}<select name="locale" defaultValue={locale}><option value="bg">Български</option><option value="en">English</option></select></label>
      <label className="field">{t.timezone}<input name="timezone" list="profile-timezones" required defaultValue={profile.timezone} /></label>
      <datalist id="profile-timezones"><option value="Europe/Sofia" /><option value="Europe/London" /><option value="Europe/Berlin" /><option value="America/New_York" /></datalist>
    </ActionForm>
    {membership && <div className="panel-links"><Link href="/home"><ArrowLeft size={15} />{t.home}</Link><Link href="/couple">{t.couple}<ArrowUpRight size={15} aria-hidden="true" /></Link></div>}
    </section></div>;
}
