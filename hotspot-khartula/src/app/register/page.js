import { redirect } from "next/navigation";
import PublicShell from "@/components/layout/PublicShell";
import RegisterForm from "@/components/auth/RegisterForm";
import { ROLE_HOME, getCurrentUserWithRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Registrasi | HotMap",
  description: "Pendaftaran akun pelapor baru sistem informasi karhutla HotMap.",
};

export default async function RegisterPage() {
  const { user, role } = await getCurrentUserWithRole();
  if (user) {
    redirect(ROLE_HOME[role] ?? "/");
  }

  return (
    <PublicShell mainClassName="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
      <RegisterForm />
    </PublicShell>
  );
}
