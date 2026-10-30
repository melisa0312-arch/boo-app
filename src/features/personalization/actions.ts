"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { personalSchema, tonightSchema } from "./model";
export type DraftReply = { version?: number; error?: "conflict" | "error" };
const draftBase = z.object({ step: z.number().int().min(0).max(30), version: z.number().int().min(0), complete: z.boolean() });
export async function savePersonalDraft(raw: unknown): Promise<DraftReply> {
  const { supabase } = await requireUser();
  const data = draftBase.extend({ answers: personalSchema }).strict().safeParse(raw);
  if (!data.success) return { error: "error" };
  const d = data.data;
  const { data: version, error } = await supabase.rpc("save_personal_preferences", { p_answers: d.answers, p_step: d.step, p_expected_version: d.version, p_complete: d.complete });
  if (error) return { error: error.message === "edit_conflict" ? "conflict" : "error" };
  if (d.complete) { revalidatePath("/preferences"); revalidatePath("/home"); }
  return { version: version! };
}
export async function saveTonightDraft(raw: unknown): Promise<DraftReply> {
  const { supabase } = await requireUser();
  const data = draftBase.extend({ sessionId: z.uuid(), revision: z.number().int().positive(), step: z.number().int().min(0).max(11), answers: tonightSchema, mode: z.enum(["quick", "detailed"]), share: z.boolean() }).strict().safeParse(raw);
  if (!data.success) return { error: "error" };
  const d = data.data;
  const { data: version, error } = await supabase.rpc("save_tonight_response", { p_session: d.sessionId, p_answers: d.answers, p_step: d.step, p_mode: d.mode, p_share: d.share, p_expected_version: d.version, p_context_revision: d.revision, p_submit: d.complete });
  if (error) return { error: ["edit_conflict", "context_changed"].includes(error.message) ? "conflict" : "error" };
  if (d.complete) revalidatePath(`/tonight/${d.sessionId}`);
  return { version: version! };
}
