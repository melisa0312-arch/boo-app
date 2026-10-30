"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { authSchema, loginSchema, localeSchema } from "@/lib/validation";
import { getDictionary } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/action-state";

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDictionary();
  if (!supabaseConfig()) return { error: t.configuration };
  const data = loginSchema.safeParse(Object.fromEntries(form));
  if (!data.success) return { error: t.invalidInput };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(data.data);
    if (error) return { error: error.code === "invalid_credentials" ? t.invalidCredentials : t.authError };
  } catch { return { error: t.authError }; }
  redirect("/home");
}
export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDictionary();
  if (!supabaseConfig()) return { error: t.configuration };
  const data = authSchema.safeParse(Object.fromEntries(form));
  if (!data.success) return { error: t.invalidInput };
  let hasSession = false;
  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { data: result, error } = await supabase.auth.signUp({ ...data.data, options: { emailRedirectTo: `${origin}/auth/confirm` } });
    if (error) return { error: t.authError };
    hasSession = Boolean(result.session);
  } catch { return { error: t.authError }; }
  if (hasSession) redirect("/profile");
  return { success: t.checkEmail };
}
export async function signOut() {
  const t = await getDictionary();
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error(t.authError);
  revalidatePath("/", "layout");
  redirect("/login");
}
export async function changeLocale(form: FormData) {
  const locale = localeSchema.safeParse(form.get("locale"));
  if (!locale.success) return;
  (await cookies()).set("bu_locale", locale.data, { path: "/", sameSite: "lax", maxAge: 31536000, httpOnly: true, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
