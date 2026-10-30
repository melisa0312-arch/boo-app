"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
/** Refresh reads only authorized, sanitized server data. No subscriptions to private answer tables. */
export function MatchRefresh() {
  const router = useRouter();
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 7000); return () => clearInterval(timer); }, [router]);
  return null;
}
