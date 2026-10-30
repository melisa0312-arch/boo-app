import { getDictionary } from "@/lib/i18n/server";
export default async function Loading() {
  const t = await getDictionary();
  return <main id="main" className="loading-state" aria-busy="true" role="status"><span className="loading-brand" aria-hidden="true">bū.</span><p>{t.loading}</p><div className="loading-bar" /></main>;
}
