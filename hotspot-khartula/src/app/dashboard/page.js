import { redirect } from "next/navigation";
import { ROLE_HOME, getCurrentUserWithRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | HotMap",
  description: "Pengalihan otomatis ke dashboard sesuai peran pengguna.",
};

export default async function DashboardRedirectPage() {
  const { user, role } = await getCurrentUserWithRole();

  if (!user) {
    redirect("/login");
  }

  redirect(ROLE_HOME[role] ?? "/pelapor");
}
