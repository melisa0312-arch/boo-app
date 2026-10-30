"use server";
import { revalidatePath } from "next/cache";
import { requireCouple } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { sessionSchema } from "@/lib/validation";
import { resolveWindow, TimeWindowError } from "@/lib/time";
import type { ActionState } from "@/lib/action-state";

export async function saveSession(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDictionary();
  const { supabase, user, coupleId } = await requireCouple();
  const parsed = sessionSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: t.invalidInput };
  let window;
  try { window = resolveWindow(parsed.data); }
  catch (error) {
    if (error instanceof TimeWindowError) {
      return { error: ({ equal: t.equalTime, past: t.pastTime, dst: t.dstTime, too_far: t.farTime, invalid: t.invalidInput })[error.code] };
    }
    return { error: t.invalidInput };
  }
  const { data: session, error } = await supabase.from("activity_sessions").insert({
    couple_id: coupleId, created_by: user.id, activity_mode: "go_out", status: "draft",
    activity_date: window.activity_date, start_time: window.start_time, end_time: window.end_time,
    timezone: window.timezone, starting_location: window.starting_location, timing: window.timing,
  }).select("id").single();
  if (error) return { error: t.saveError };
  revalidatePath("/tonight");
  revalidatePath("/home");
  return { success: t.sessionSaved, sessionId: session!.id };
}
