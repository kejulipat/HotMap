import DashboardShell from "@/components/layout/DashboardShell";
import { requireRole } from "@/lib/auth";

export default async function PelaporLayout({ children }) {
  const { user, profile } = await requireRole(["pelapor", "admin"]);

  return (
    <DashboardShell
      role="pelapor"
      userInfo={{
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
      }}
    >
      {children}
    </DashboardShell>
  );
}
