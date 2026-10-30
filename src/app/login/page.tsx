import { AuthScreen } from "@/components/auth-screen";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  return <AuthScreen mode="login" notice={(await searchParams).notice} />;
}
