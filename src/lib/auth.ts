import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseConfig } from "./supabase/config";

export const requireUser = cache(async () => {
  if (!supabaseConfig()) redirect("/login?notice=configuration");
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
});

export const getContext = cache(async () => {
  const { supabase, user } = await requireUser();
  const [profile, membership] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("couple_members").select("couple_id").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile.error || membership.error) throw new Error("Unable to load account. Check the database migration and connection.");
  return { supabase, user, profile: profile.data, membership: membership.data };
});

export async function requireCouple() {
  const context = await getContext();
  if (!context.profile.display_name) redirect("/profile");
  if (!context.membership) redirect("/couple");
  return { ...context, coupleId: context.membership.couple_id };
}
