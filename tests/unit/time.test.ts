import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { localNow, resolveWindow, TimeWindowError } from "@/lib/time";
import { authSchema, invitationSchema, profileSchema, sessionSchema } from "@/lib/validation";
import { bg, en } from "@/lib/i18n/dictionaries";

const now = Temporal.Instant.from("2026-10-30T12:00:00Z");
const base = { activity_date: "2026-10-30", start_time: "20:00", end_time: "23:00", timezone: "Europe/Sofia", starting_location: "sofia" as const, timing: "future" as const };
function errorCode(input: typeof base) {
  try { resolveWindow(input, now); } catch (error) { expect(error).toBeInstanceOf(TimeWindowError); return (error as TimeWindowError).code; }
}
describe("Tonight time windows", () => {
  it("converts Sofia wall times to UTC", () => {
    expect(resolveWindow(base, now)).toMatchObject({ starts_at: "2026-10-30T18:00:00Z", ends_at: "2026-10-30T21:00:00Z", ends_next_day: false });
  });
  it("crosses midnight into the next calendar day", () => {
    expect(resolveWindow({ ...base, start_time: "23:30", end_time: "01:15" }, now)).toMatchObject({ starts_at: "2026-10-30T21:30:00Z", ends_at: "2026-10-30T23:15:00Z", ends_next_day: true });
  });
  it("handles year boundaries", () => {
    expect(resolveWindow({ ...base, activity_date: "2026-12-31", start_time: "23:00", end_time: "02:00" }, now).ends_at).toBe("2027-01-01T00:00:00Z");
  });
  it("rejects equal times", () => expect(errorCode({ ...base, end_time: "20:00" })).toBe("equal"));
  it("rejects past windows", () => expect(errorCode({ ...base, activity_date: "2026-10-29" })).toBe("past"));
  it("rejects dates beyond the planning horizon", () => expect(errorCode({ ...base, activity_date: "2028-01-01" })).toBe("too_far"));
  it("rejects nonexistent Sofia spring-forward time", () => {
    expect(errorCode({ ...base, activity_date: "2027-03-28", start_time: "03:30" })).toBe("dst");
  });
  it("rejects repeated Sofia fall-back time", () => {
    expect(errorCode({ ...base, activity_date: "2027-10-31", start_time: "03:30" })).toBe("dst");
  });
  it("uses the current wall time for now, ignoring stale client times", () => {
    const result = resolveWindow({ ...base, activity_date: "2020-01-01", start_time: "00:00", timing: "now" }, now);
    expect(result).toMatchObject({ activity_date: "2026-10-30", start_time: "14:00", starts_at: "2026-10-30T12:00:00Z" });
  });
  it("uses the selected timezone rather than the server timezone", () => {
    expect(localNow("America/New_York", now)).toEqual({ date: "2026-10-30", time: "08:00" });
    expect(resolveWindow({ ...base, timezone: "America/New_York" }, now).starts_at).toBe("2026-10-31T00:00:00Z");
  });
});
describe("server input contracts", () => {
  it("rejects malformed time and date", () => {
    expect(sessionSchema.safeParse({ ...base, start_time: "25:00" }).success).toBe(false);
    expect(sessionSchema.safeParse({ ...base, activity_date: "2026-02-30" }).success).toBe(false);
  });
  it("accepts only supported manual locations", () => expect(sessionSchema.safeParse({ ...base, starting_location: "anywhere" }).success).toBe(false));
  it("rejects invalid timezones", () => expect(profileSchema.safeParse({ display_name: "Мелиса", locale: "bg", timezone: "Moon/Sea" }).success).toBe(false));
  it("rejects blank display names", () => expect(profileSchema.safeParse({ display_name: "  ", locale: "bg", timezone: "Europe/Sofia" }).success).toBe(false));
  it("requires a strong minimum password and valid email", () => {
    expect(authSchema.safeParse({ email: "not-an-email", password: "1234567890" }).success).toBe(false);
    expect(authSchema.safeParse({ email: "melisa@example.com", password: "short" }).success).toBe(false);
  });
  it("accepts only a complete 256-bit invitation", () => {
    expect(invitationSchema.safeParse("a".repeat(64)).success).toBe(true);
    expect(invitationSchema.safeParse("a".repeat(63)).success).toBe(false);
    expect(invitationSchema.safeParse("<script>").success).toBe(false);
  });
  it("keeps both dictionaries complete", () => expect(Object.keys(bg).sort()).toEqual(Object.keys(en).sort()));
});
