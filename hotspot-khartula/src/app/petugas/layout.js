import DashboardShell from "@/components/layout/DashboardShell";
import { requireRole } from "@/lib/auth";

export default async function PetugasLayout({ children }) {
  const { user, profile, role } = await requireRole(["petugas", "admin"]);

  return (
    <DashboardShell
      role="petugas"
      actualRole={role}
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
