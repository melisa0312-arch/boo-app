"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTexts } from "@/components/locale-provider";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTexts();
  return <main id="main" className="error-state"><span className="error-symbol" aria-hidden="true"><ArrowUpRight size={42} /></span><h1>{t.errorTitle}</h1><p>{t.errorBody}</p><button className="btn btn-primary" onClick={reset}>{t.retry}</button><Link href="/" className="text-link">{t.home}</Link></main>;
}
