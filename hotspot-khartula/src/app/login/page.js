import { redirect } from "next/navigation";
import PublicShell from "@/components/layout/PublicShell";
import AuthBackdropSection from "@/components/auth/AuthBackdropSection";
import LoginForm from "@/components/auth/LoginForm";
import {
  ROLE_HOME,
  getCurrentUserWithRole,
  getFastLoginAvailability,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Masuk | HotMap",
  description: "Halaman masuk pengguna HotMap (SIPKARHUTLA).",
};

export default async function LoginPage({ searchParams }) {
  const { user, role } = await getCurrentUserWithRole();
  if (user) {
    redirect(ROLE_HOME[role] ?? "/");
  }

  const resolvedParams = await searchParams;
  const redirectTo =
    typeof resolvedParams?.redirectTo === "string"
      ? resolvedParams.redirectTo
      : "";

  const fastLogin = getFastLoginAvailability();

  return (
    <PublicShell mainClassName="flex-1 flex flex-col">
      <AuthBackdropSection>
        <LoginForm redirectTo={redirectTo} fastLogin={fastLogin} />
      </AuthBackdropSection>
    </PublicShell>
  );
}
