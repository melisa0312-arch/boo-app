import { requireUser } from "@/lib/auth";
import { Header } from "@/components/header";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <><Header authenticated /><main id="main" className="page-width app-main">{children}</main></>;
}
