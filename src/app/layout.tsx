import type { Metadata } from "next";
import "@fontsource-variable/sofia-sans";
import "@fontsource-variable/unbounded";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/locale-provider";

export const metadata: Metadata = {
  title: { default: "bū. — Повече нас.", template: "%s · bū." },
  description: "Малките моменти. Голямото „ние“. Вашето лично пространство за вечери, планове и споделени истории.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale} data-scroll-behavior="smooth"><body><LocaleProvider locale={locale}>
    <a className="skip-link" href="#main">{locale === "bg" ? "Към съдържанието" : "Skip to content"}</a>
    {children}
  </LocaleProvider></body></html>;
}
