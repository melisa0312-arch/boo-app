"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { sessionSchema } from "@/lib/validation";
import { resolveWindow, TimeWindowError } from "@/lib/time";
import { personalCopy } from "../personalization/copy";
import type { ActionState } from "@/lib/action-state";
const sharedContextSchema = sessionSchema.extend({ transport: z.enum(["walk", "car", "transit", "bicycle"]), max_travel_minutes: z.coerce.number().int().min(0).max(180), budget_level: z.coerce.number().int().min(0).max(3), environment: z.enum(["either", "indoor", "outdoor"]) });
export async function updateSharedContext(id: string, revision: number, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const t = await getDictionary(), p = personalCopy(await getLocale());
  const parsed = sharedContextSchema.safeParse(Object.fromEntries(form));
  if (!z.uuid().safeParse(id).success || !parsed.success) return { error: t.invalidInput };
  let window;
  try { window = resolveWindow(parsed.data); } catch (error) {
    if (error instanceof TimeWindowError) return { error: ({ equal: t.equalTime, past: t.pastTime, dst: t.dstTime, too_far: t.farTime, invalid: t.invalidInput })[error.code] };
    return { error: t.invalidInput };
  }
  const { data: d } = parsed;
  const { error } = await supabase.rpc("update_tonight_context", { p_session: id, p_expected_revision: revision, p_context: {
    activity_date: window.activity_date, start_time: window.start_time, end_time: window.end_time, timezone: window.timezone, timing: window.timing,
    starting_location: window.starting_location, transport: d.transport, max_travel_minutes: d.max_travel_minutes, budget_level: d.budget_level, environment: d.environment,
  } });
  if (error) return { error: error.message === "edit_conflict" ? p.conflict : t.saveError };
  revalidatePath(`/tonight/${id}`); revalidatePath("/home");
  redirect(`/tonight/${id}?stage=answers`);
}
export async function matchAction(id: string, operation: "calculate" | "feedback" | "select", _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const t = personalCopy(await getLocale());
  if (!z.uuid().safeParse(id).success) return { error: t.error };
  if (operation === "feedback") {
    const data = z.object({ concept: z.string().min(1).max(60), reason: z.enum(["not_tonight", "too_active", "too_familiar", "not_interested"]) }).safeParse(Object.fromEntries(form));
    if (!data.success) return { error: t.error };
    const { error } = await supabase.rpc("record_match_feedback", { p_session: id, p_concept: data.data.concept, p_reason: data.data.reason });
    if (error) return { error: t.error };
  } else if (operation === "select") {
    const data = z.object({ result: z.uuid(), concept: z.string().min(1).max(60) }).safeParse(Object.fromEntries(form));
    if (!data.success) return { error: t.error };
    const { error } = await supabase.rpc("select_match_concept", { p_session: id, p_result: data.data.result, p_concept: data.data.concept });
    if (error) return { error: t.stale };
    revalidatePath(`/tonight/${id}`); revalidatePath("/home"); return { success: t.planSaved };
  }
  const { data, error } = await supabase.rpc("calculate_couple_match", { p_session: id });
  if (error) return { error: t.error };
  revalidatePath(`/tonight/${id}`);
  return { success: data && typeof data === "object" && "state" in data && data.state === "waiting" ? t.waiting : t.matched };
}
