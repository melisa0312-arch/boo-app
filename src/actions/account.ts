"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getContext, requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { coupleSchema, invitationSchema, profileSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export async function saveProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDictionary();
  const { supabase, user, profile, membership } = await getContext();
  const data = profileSchema.safeParse(Object.fromEntries(form));
  if (!data.success) return { error: t.invalidInput };
  const { error } = await supabase.from("profiles").update(data.data).eq("id", user.id);
  if (error) return { error: t.saveError };
  (await cookies()).set("bu_locale", data.data.locale, { path: "/", sameSite: "lax", maxAge: 31536000, httpOnly: true, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
  if (!membership) redirect("/couple");
  if (!profile.display_name) redirect("/home");
  return { success: t.profileSaved };
}

export async function createCouple(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDictionary();
  const { supabase } = await requireUser();
  const data = coupleSchema.safeParse(Object.fromEntries(form));
  if (!data.success) return { error: t.invalidInput };
  const { error } = await supabase.rpc("create_couple", { couple_name: data.data.name });
  if (error) return { error: error.message === "already_member" ? t.alreadyMember : t.saveError };
  revalidatePath("/", "layout");
  redirect("/couple");
}

export async function joinCouple(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDictionary();
  const { supabase } = await requireUser();
  const data = invitationSchema.safeParse(form.get("token"));
  if (!data.success) return { error: t.inviteError };
  const { error } = await supabase.rpc("join_couple", { invitation_token: data.data });
  if (error) return { error: error.message === "already_member" ? t.alreadyMember : error.message === "couple_full" ? t.fullCouple : t.inviteError };
  (await cookies()).delete("bu_invitation");
  revalidatePath("/", "layout");
  redirect("/home");
}

export async function issueInvitation(): Promise<ActionState> {
  const t = await getDictionary();
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("issue_couple_invitation");
  if (error || !data) return { error: error?.message === "couple_full" ? t.fullCouple : t.saveError };
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { invitation: `${origin}/join?token=${data}` };
}
