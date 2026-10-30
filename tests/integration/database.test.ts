import { beforeAll, describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { Temporal } from "@js-temporal/polyfill";
import type { Database } from "@/lib/supabase/database.types";

if (existsSync(".env.local")) loadEnvFile(".env.local");
const enabled = process.env.BU_INTEGRATION === "1";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const allowed = process.env.BU_ALLOW_TEST_SIGNUPS === "1" && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url);

describe.skipIf(!enabled)("real Supabase API + RLS", () => {
  const clients: SupabaseClient<Database>[] = [];
  const ids: string[] = [];
  let coupleId: string;
  let invitation: string;
  beforeAll(async () => {
    if (!allowed || !key) throw new Error("Integration tests require a disposable loopback Supabase and BU_ALLOW_TEST_SIGNUPS=1.");
    for (let i = 0; i < 4; i++) {
      const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await client.auth.signUp({ email: `bu-${randomUUID()}@example.test`, password: randomBytes(18).toString("hex") });
      expect(error).toBeNull();
      expect(data.session).not.toBeNull();
      ids.push(data.user!.id); clients.push(client);
    }
  }, 30000);
  it("bootstraps private profiles and creates a real couple", async () => {
    const profile = await clients[0].from("profiles").select("*");
    expect(profile.error).toBeNull(); expect(profile.data).toHaveLength(1); expect(profile.data![0].id).toBe(ids[0]);
    const couple = await clients[0].rpc("create_couple", { couple_name: "BŪ integration" });
    expect(couple.error).toBeNull(); coupleId = couple.data!;
    const outsider = await clients[2].from("couples").select("*");
    expect(outsider.error).toBeNull(); expect(outsider.data).toEqual([]);
  });
  it("revokes older tokens and rejects invalid invitations", async () => {
    const old = await clients[0].rpc("issue_couple_invitation");
    const issued = await clients[0].rpc("issue_couple_invitation");
    expect(issued.error).toBeNull(); invitation = issued.data!;
    expect(invitation).toMatch(/^[a-f0-9]{64}$/);
    expect((await clients[1].rpc("join_couple", { invitation_token: old.data! })).error?.message).toBe("invalid_invitation");
    expect((await clients[1].rpc("join_couple", { invitation_token: "f".repeat(64) })).error?.message).toBe("invalid_invitation");
  });
  it("permits exactly one concurrent join and never more than two members", async () => {
    const results = await Promise.all([clients[1], clients[2]].map((client) => client.rpc("join_couple", { invitation_token: invitation })));
    expect(results.filter((result) => !result.error)).toHaveLength(1);
    expect(results.filter((result) => result.error)).toHaveLength(1);
    const members = await clients[0].from("couple_members").select("*").eq("couple_id", coupleId);
    expect(members.data).toHaveLength(2);
    expect((await clients[3].rpc("join_couple", { invitation_token: invitation })).error?.message).toBe("invalid_invitation");
  });
  it("persists an overnight session and blocks unrelated reads and writes", async () => {
    const date = Temporal.Now.zonedDateTimeISO("Europe/Sofia").toPlainDate().add({ days: 1 }).toString();
    const values = { couple_id: coupleId, created_by: ids[0], activity_date: date, start_time: "23:30", end_time: "01:00", timezone: "Europe/Sofia", starting_location: "chavdar", timing: "future" };
    const saved = await clients[0].from("activity_sessions").insert(values).select().single();
    expect(saved.error).toBeNull(); expect(saved.data?.ends_next_day).toBe(true);
    const reloaded = await clients[0].from("activity_sessions").select("*").eq("id", saved.data!.id).single();
    expect(reloaded.error).toBeNull(); expect(reloaded.data?.start_time).toBe("23:30:00");
    expect((await clients[3].from("activity_sessions").select("*")).data).toEqual([]);
    expect((await clients[3].from("activity_sessions").insert({ ...values, created_by: ids[3] })).error?.code).toBe("42501");
    expect((await clients[0].from("activity_sessions").insert({ ...values, created_by: ids[3] })).error?.code).toBe("42501");
  });
  it("protects private records and anonymous access", async () => {
    expect((await clients[0].from("user_preferences").select("*")).data).toHaveLength(1);
    const leak = await clients[0].from("couple_invitations").select("token_hash");
    expect(leak.error?.code).toBe("42501");
    const anonymous = createClient<Database>(url, key, { auth: { persistSession: false } });
    expect((await anonymous.from("profiles").select("*")).error?.code).toBe("42501");
    expect((await anonymous.rpc("issue_couple_invitation")).error?.code).toBe("42501");
  });
});
