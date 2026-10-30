import { test, expect, type Page } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { Temporal } from "@js-temporal/polyfill";
import AxeBuilder from "@axe-core/playwright";

if (existsSync(".env.local")) loadEnvFile(".env.local");
const integration = process.env.BU_ALLOW_TEST_SIGNUPS === "1" && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) }))).toEqual([]);
}

test("Bulgarian welcome, real language switch, and protected routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Повече нас.");
  await audit(page);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("More us.");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello again.");
  await audit(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("malformed invitation and missing page have recovery paths", async ({ page }) => {
  await page.goto("/join?token=bad");
  await expect(page.getByRole("alert").filter({ hasText: "Поканата" })).toBeVisible();
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("страница");
  await expect(page.getByRole("link", { name: "Начало" })).toHaveAttribute("href", "/");
});

async function register(page: Page, email: string, password: string, name: string) {
  await page.goto("/signup");
  await page.getByLabel("Имейл", { exact: true }).fill(email);
  await page.getByLabel("Парола", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Създай акаунт", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/, { timeout: 20000 });
  await page.getByLabel("Как да те наричаме?").fill(name);
  await page.getByRole("button", { name: "Запази профила", exact: true }).click();
  await expect(page).toHaveURL(/\/couple$/);
}

test("two independent accounts join, persist an overnight session, and log in again", async ({ page, browser }, testInfo) => {
  test.skip(!integration, "Requires explicit test-signup opt-in and a disposable local Supabase instance.");
  test.setTimeout(120000);
  const email = `bu-e2e-${randomUUID()}@example.test`;
  const password = randomBytes(18).toString("hex");
  await register(page, email, password, "Мелиса");
  await page.getByLabel("Как се казва вашият свят?").fill("Мелиса + Стефан");
  await page.getByRole("button", { name: "Създай нашето пространство" }).click();
  await expect(page.getByRole("heading", { name: "Мелиса + Стефан", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Създай лична покана", exact: true }).click();
  const invitation = await page.getByLabel("Лична покана", { exact: true }).inputValue();
  expect(invitation).toContain("/join?token=");

  const partnerContext = await browser.newContext({ ...testInfo.project.use, baseURL: "http://127.0.0.1:3000" });
  const partner = await partnerContext.newPage();
  await partner.goto(invitation);
  await expect(partner).toHaveURL(/\/login/);
  await register(partner, `bu-partner-${randomUUID()}@example.test`, randomBytes(18).toString("hex"), "Стефан");
  await partner.getByRole("button", { name: "Приеми поканата", exact: true }).click();
  await expect(partner).toHaveURL(/\/home$/);
  await expect(partner.getByText("ХЕЙ, Стефан + Мелиса")).toBeVisible();

  await page.goto("/home");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("нещо наше.");
  await expect(page.getByText("ХЕЙ, Мелиса + Стефан")).toBeVisible();
  await audit(page);
  await page.screenshot({ path: `test-results/home-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("link", { name: "Да открием следващото ни приключение", exact: true }).click();
  await audit(page);
  await page.getByText("Друг ден", { exact: true }).click();
  const date = Temporal.Now.zonedDateTimeISO("Europe/Sofia").toPlainDate().add({ days: 1 }).toString();
  await page.getByLabel("Дата", { exact: true }).fill(date);
  await page.getByLabel("В колко тръгваме?").fill("23:30");
  await page.getByLabel("Докога сме навън?").fill("23:30");
  await page.getByRole("button", { name: "Запази нашата вечер", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "различни" })).toBeVisible();
  await page.getByLabel("Докога сме навън?").fill("01:15");
  await page.getByText("Чавдар", { exact: true }).click();
  await page.getByRole("button", { name: "Запази нашата вечер", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Вечерта е запазена");
  await page.reload();
  for (const text of ["23:30", "01:15", "Чавдар"]) await expect(page.locator(".session-card")).toContainText(text);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await partner.reload();
  await expect(partner.locator(".session-card")).toContainText("23:30");
  await page.getByRole("button", { name: "Изход", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/tonight");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Имейл", { exact: true }).fill(email);
  await page.getByLabel("Парола", { exact: true }).fill("deliberately-wrong-password");
  await page.getByRole("button", { name: "Вход", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "не съвпадат" })).toBeVisible();
  await page.getByLabel("Имейл", { exact: true }).fill(email);
  await page.getByLabel("Парола", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Вход", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator(".session-card")).toContainText("23:30");
  await page.goto("/profile");
  await page.getByLabel("Как да те наричаме?").fill("Мелиса БŪ");
  await page.getByRole("button", { name: "Запази профила", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Профилът е запазен");
  await page.reload();
  await expect(page.getByLabel("Как да те наричаме?")).toHaveValue("Мелиса БŪ");
  await partner.reload();
  await expect(partner.getByText("ХЕЙ, Стефан + Мелиса БŪ")).toBeVisible();
  await partnerContext.close();
});
