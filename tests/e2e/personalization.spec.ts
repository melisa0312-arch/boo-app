import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { Temporal } from "@js-temporal/polyfill";
import AxeBuilder from "@axe-core/playwright";
import type { Database } from "@/lib/supabase/database.types";
import { personalQuestions, tonightQuestions } from "@/features/personalization/questions";
import { interests } from "@/features/personalization/model";
if (existsSync(".env.local")) loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "", key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const local = process.env.BU_ALLOW_TEST_SIGNUPS === "1" && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url);
async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login"); await page.getByLabel("Имейл", { exact: true }).fill(credentials.email); await page.getByLabel("Парола", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Вход", exact: true }).click(); await expect(page).toHaveURL(/\/home$/);
}
async function audit(page: Page) { const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]); }
test("private onboarding, independent Tonight answers, match, feedback and shared edits", async ({ page, browser }, info) => {
  test.skip(!local, "Only opt-in disposable local Supabase accounts"); test.setTimeout(240000);
  const accounts = [];
  for (let i = 0; i < 2; i++) {
    const client = createClient<Database>(url, key, { auth: { persistSession: false } });
    const credentials = { email: `step02-browser-${randomUUID()}@example.test`, password: randomBytes(20).toString("hex") };
    const signed = await client.auth.signUp(credentials); expect(signed.error).toBeNull();
    expect((await client.from("profiles").update({ display_name: `Local ${i ? "B" : "A"}` }).eq("id", signed.data.user!.id)).error).toBeNull();
    accounts.push({ client, credentials, id: signed.data.user!.id });
  }
  const [a, b] = accounts;
  expect((await a.client.rpc("create_couple", { couple_name: "Local Step 02 browser test" })).error).toBeNull();
  await login(page, a.credentials); await page.goto("/preferences");
  await expect(page.getByRole("heading", { name: personalQuestions[0].title.bg, exact: true })).toBeVisible();
  await audit(page);
  await page.screenshot({ path: `test-results/step02-onboarding-${info.project.name}.png`, fullPage: true });
  await page.getByRole("radio", { name: "4", exact: true }).check(); await page.getByRole("button", { name: "Напред", exact: true }).click();
  await expect(page.getByRole("heading", { name: personalQuestions[1].title.bg, exact: true })).toBeVisible();
  await expect(page.getByText("Запазено лично", { exact: true })).toBeVisible(); await page.reload();
  await expect(page.getByRole("heading", { name: personalQuestions[1].title.bg, exact: true })).toBeVisible();
  for (let i = 1; i < personalQuestions.length; i++) {
    await expect(page.getByRole("heading", { name: personalQuestions[i].title.bg, exact: true })).toBeVisible();
    if (i < 12) { await page.getByRole("radio", { name: "3", exact: true }).check(); await page.getByRole("button", { name: "Напред", exact: true }).click(); }
    else await page.getByRole("button", { name: "Пропусни", exact: true }).click();
  }
  await page.getByRole("button", { name: "Готово, това съм аз", exact: true }).click();
  await expect(page.getByText("Запазено лично", { exact: true })).toBeVisible(); await page.reload();
  await expect(page.getByRole("heading", { name: "Твоята малка вселена.", exact: true })).toBeVisible(); await audit(page);
  await page.screenshot({ path: `test-results/step02-summary-${info.project.name}.png`, fullPage: true });
  await page.goto("/tonight"); await page.getByText("Друг ден", { exact: true }).click();
  const date = Temporal.Now.zonedDateTimeISO("Europe/Sofia").toPlainDate().add({ days: 1 }).toString();
  await page.getByLabel("Дата", { exact: true }).fill(date); await page.getByLabel("В колко тръгваме?").fill("21:00"); await page.getByLabel("Докога сме навън?").fill("01:30");
  await page.getByRole("button", { name: "Запази нашата вечер", exact: true }).click(); await page.getByRole("link", { name: "Продължи вечерта", exact: true }).click();
  await expect(page).toHaveURL(/\/tonight\/[0-9a-f-]{36}$/);
  const sessionId = new URL(page.url()).pathname.split("/").pop()!;
  await page.getByRole("button", { name: "Запази общия контекст", exact: true }).click(); await expect(page).toHaveURL(/stage=answers/);
  await answerTonight(page, false);
  await page.locator(".preference-summary").getByRole("link", { name: "Нашият match", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Чакаме другия BŪ.", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Намери общата ни идея", exact: true })).toBeDisabled();
  const token = (await a.client.rpc("issue_couple_invitation")).data!; expect((await b.client.rpc("join_couple", { invitation_token: token })).error).toBeNull();
  expect((await b.client.rpc("save_personal_preferences", { p_answers: { ratings: Object.fromEntries(interests.map(k => [k, 3])) }, p_step: personalQuestions.length, p_expected_version: 0, p_complete: true })).error).toBeNull();
  const partnerContext = await browser.newContext({ ...info.project.use, baseURL: "http://127.0.0.1:3000" });
  const partner = await partnerContext.newPage(); await login(partner, b.credentials); await partner.goto(`/tonight/${sessionId}?stage=answers`);
  await partner.getByRole("button", { name: /Detailed Match/ }).click(); await answerTonight(partner, true);
  await page.reload(); await page.getByRole("button", { name: "Намери общата ни идея", exact: true }).click();
  await expect(page.locator(".top-match h3")).toBeVisible(); expect(await page.locator("body").innerText()).not.toContain("LOCAL_SYNTHETIC_NOTE");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await audit(page);
  await page.screenshot({ path: `test-results/step02-results-${info.project.name}.png`, fullPage: true });
  const first = await page.locator(".top-match h3").innerText();
  await page.locator(".top-match").getByRole("button", { name: "Запази като начален план", exact: true }).click(); await expect(page.getByRole("status").filter({ hasText: "Избраната идея е запазена" })).toBeVisible();
  await page.locator(".reroll-panel").getByRole("button", { name: "Да опитаме друга посока", exact: true }).click(); await expect(page.locator(".top-match h3")).not.toHaveText(first);
  await partner.goto(`/tonight/${sessionId}?stage=context`); await partner.getByLabel("Докога сме навън?").fill("02:30"); await partner.getByRole("button", { name: "Запази общия контекст", exact: true }).click();
  await page.reload(); await expect(page.getByRole("button", { name: "Намери общата ни идея", exact: true })).toBeDisabled();
  await page.goto(`/tonight/${sessionId}?stage=context`); await expect(page.getByLabel("Докога сме навън?")).toHaveValue("02:30");
  await page.getByRole("button", { name: "English", exact: true }).click(); await expect(page.getByRole("combobox", { name: "How are we getting around?", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Български", exact: true }).click(); await page.getByRole("button", { name: "Изход", exact: true }).click(); await login(page, a.credentials);
  await page.goto("/preferences"); await expect(page.getByRole("heading", { name: "Твоята малка вселена.", exact: true })).toBeVisible();
  await partnerContext.close();
});
async function answerTonight(page: Page, detailed: boolean) {
  const questions = detailed ? tonightQuestions : tonightQuestions.slice(0, 5);
  for (const q of questions) {
    await expect(page.getByRole("heading", { name: q.title.bg, exact: true })).toBeVisible();
    if (q.key === "mood") await page.getByRole("radio", { name: "Любопитно", exact: true }).check();
    if (q.key === "energy") { const slider = page.getByRole("slider"); await slider.focus(); await slider.press("Home"); await slider.press("ArrowRight"); await slider.press("ArrowRight"); }
    if (q.key === "notes") await page.getByRole("textbox", { name: q.title.bg, exact: true }).fill("LOCAL_SYNTHETIC_NOTE");
    await page.getByRole("button", { name: "Напред", exact: true }).click();
  }
  await page.getByRole("button", { name: "Готовност за нашия match", exact: true }).click();
  await expect(page.getByText("Запазено лично", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ти си готов/а.", exact: true })).toBeVisible();
}
