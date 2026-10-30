"use client";
import { createContext, useContext, type ReactNode } from "react";
import { dictionary, type Locale } from "@/lib/i18n/dictionaries";
const LocaleContext = createContext<Locale>("bg");
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useTexts() { const locale = useContext(LocaleContext); return { t: dictionary(locale), locale }; }
