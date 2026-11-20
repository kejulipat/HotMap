import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export default function PublicShell({
  currentUser = null,
  children,
  mainClassName = "flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7",
}) {
  return (
    <div className="min-h-screen bg-[#F6F7F3] text-[#14231B] flex flex-col font-sans">
      <PublicNavbar currentUser={currentUser} />
      <main className={mainClassName}>{children}</main>
      <PublicFooter />
    </div>
  );
}
