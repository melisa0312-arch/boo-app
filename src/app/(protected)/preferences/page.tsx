import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { personalSchema } from "@/features/personalization/model";
import { personalCopy } from "@/features/personalization/copy";
import { personalQuestions } from "@/features/personalization/questions";
import { PreferenceWizard } from "@/features/personalization/wizard";
export default async function PreferencesPage() {
  const { supabase, profile, user } = await getContext();
  if (!profile.display_name) redirect("/profile");
  const locale = await getLocale(), t = personalCopy(locale);
  const pref = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single();
  if (pref.error) throw new Error("Unable to load private preferences");
  const answers = personalSchema.parse(pref.data.answers);
  return <div className="personalization-layout"><aside className="personalization-intro"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p><div className="personal-orbit" aria-hidden="true"><Sparkles /><span>100%<br />YOU.</span><i /></div><p className="field-hint">{t.private}</p></aside>
    <PreferenceWizard kind="personal" version={pref.data.version} initial={{ answers, step: pref.data.onboarding_step, complete: Boolean(pref.data.completed_at && pref.data.onboarding_step >= personalQuestions.length), mode: "quick", share: false }} />
  </div>;
}
