import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export default function PublicShell({
  currentUser = null,
  children,
  mainClassName = "flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-10 sm:py-12 space-y-8",
}) {
  return (
    <div className="min-h-screen bg-white text-[#2C3325] flex flex-col font-sans">
      <PublicNavbar currentUser={currentUser} />
      <main className={mainClassName}>{children}</main>
      <PublicFooter />
    </div>
  );
}
