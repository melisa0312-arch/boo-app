import { z } from "zod";

export const localeSchema = z.enum(["bg", "en"]);
export const timezoneSchema = z.string().refine((value) => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}, "Invalid timezone");
export const authSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});
export const loginSchema = authSchema.extend({ password: z.string().min(1).max(128) });
export const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(60),
  locale: localeSchema,
  timezone: timezoneSchema,
});
export const coupleSchema = z.object({ name: z.string().trim().min(1).max(60) });
export const invitationSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const sessionSchema = z.object({
  activity_date: z.iso.date(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: timezoneSchema,
  starting_location: z.enum(["sofia", "chavdar"]),
  timing: z.enum(["now", "today", "future"]),
});
export type SessionInput = z.infer<typeof sessionSchema>;
