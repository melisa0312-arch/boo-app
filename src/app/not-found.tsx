import { ArrowLink } from "@/components/ui";
import { getDictionary } from "@/lib/i18n/server";
export default async function NotFound() {
  const t = await getDictionary();
  return <main id="main" className="error-state"><span className="error-symbol" aria-hidden="true">404</span><h1>{t.notFound}</h1><ArrowLink href="/">{t.home}</ArrowLink></main>;
}
