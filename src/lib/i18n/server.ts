import "server-only";
import { cookies } from "next/headers";
import { dictionary, type Locale } from "./dictionaries";
export async function getLocale(): Promise<Locale> { return (await cookies()).get("bu_locale")?.value === "en" ? "en" : "bg"; }
export async function getDictionary() { return dictionary(await getLocale()); }
