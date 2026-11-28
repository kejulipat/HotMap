import { DashboardPageSkeleton } from "@/components/ui/SharedUI";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F7F8F2] text-[#2C3325] flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-[#F7F8F2]/95 backdrop-blur border-b border-[#DCE0D5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#557029]" />
            <div className="space-y-1.5">
              <div className="h-4 w-20 rounded bg-[#DCE0D5]" />
              <div className="h-2.5 w-36 rounded bg-[#DCE0D5]" />
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-7">
            <div className="h-4 w-16 rounded bg-[#DCE0D5]" />
            <div className="h-4 w-24 rounded bg-[#DCE0D5]" />
            <div className="h-4 w-14 rounded bg-[#DCE0D5]" />
          </div>
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="h-9 w-24 rounded-lg bg-[#DCE0D5]" />
            <div className="h-9 w-36 rounded-lg bg-[#DCE0D5]" />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <DashboardPageSkeleton />
      </main>
    </div>
  );
}
