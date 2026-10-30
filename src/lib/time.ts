import { Temporal } from "@js-temporal/polyfill";
import { sessionSchema, type SessionInput } from "./validation";

export class TimeWindowError extends Error {
  constructor(public code: "invalid" | "equal" | "past" | "dst" | "too_far") { super(code); }
}
export function localNow(timezone = "Europe/Sofia", now = Temporal.Now.instant()) {
  const local = now.toZonedDateTimeISO(timezone);
  return { date: local.toPlainDate().toString(), time: local.toPlainTime().toString({ smallestUnit: "minute" }) };
}
/** End before start explicitly means the following local calendar day. Equal times are invalid. */
export function resolveWindow(raw: SessionInput, now = Temporal.Now.instant()) {
  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) throw new TimeWindowError("invalid");
  const data = { ...parsed.data };
  const current = localNow(data.timezone, now);
  if (data.timing === "now") { data.activity_date = current.date; data.start_time = current.time; }
  if (data.timing === "today") data.activity_date = current.date;
  if (data.start_time === data.end_time) throw new TimeWindowError("equal");
  let start: Temporal.ZonedDateTime;
  let end: Temporal.ZonedDateTime;
  const overnight = data.end_time < data.start_time;
  try {
    const date = Temporal.PlainDate.from(data.activity_date);
    const endDate = overnight ? date.add({ days: 1 }) : date;
    start = date.toPlainDateTime(data.start_time).toZonedDateTime(data.timezone, { disambiguation: "reject" });
    end = endDate.toPlainDateTime(data.end_time).toZonedDateTime(data.timezone, { disambiguation: "reject" });
  } catch { throw new TimeWindowError("dst"); }
  if (Temporal.Instant.compare(start.toInstant(), now.subtract({ minutes: 5 })) < 0) throw new TimeWindowError("past");
  if (Temporal.Instant.compare(start.toInstant(), now.add({ hours: 24 * 366 })) > 0) throw new TimeWindowError("too_far");
  return { ...data, ends_next_day: overnight, starts_at: start.toInstant().toString(), ends_at: end.toInstant().toString() };
}
