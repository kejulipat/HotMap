import { redirect } from "next/navigation";
import PublicShell from "@/components/layout/PublicShell";
import LoginForm from "@/components/auth/LoginForm";
import {
  ROLE_HOME,
  getCurrentUserWithRole,
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

  return (
    <PublicShell mainClassName="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
      <LoginForm redirectTo={redirectTo} />
    </PublicShell>
  );
}
